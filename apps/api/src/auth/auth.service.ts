import { BadRequestException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  DbCollection,
  Invitation,
  MemberTypes,
  MongooseQueryModel,
  Organization,
  Project,
  User,
  UserLoginProviderEnum,
  UserLoginWithPasswordRequest,
  UserStatus
} from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Document, Model } from 'mongoose';
import { get, Response } from 'request';
import { UsersService } from '../shared/services/users.service';
import { ModuleRef } from '@nestjs/core';
import { ProjectService } from '../shared/services/project.service';
import { DEFAULT_QUERY_FILTER } from '../shared/helpers/defaultValueConstant';
import { OrganizationService } from '../shared/services/organization.service';
import { InvitationService } from '../shared/services/invitation.service';
import { emailAddressValidator, invitationExpiryChecker } from '../shared/helpers/helpers';

@Injectable()
export class AuthService implements OnModuleInit {
  private _userService: UsersService;
  private _projectService: ProjectService;
  private _organizationService: OrganizationService;
  private _invitationService: InvitationService;

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(DbCollection.users) private readonly _userModel: Model<User & Document>,
    private _moduleRef: ModuleRef
  ) {
  }

  /**
   * on module init
   */
  onModuleInit(): any {
    this._userService = this._moduleRef.get('UsersService', { strict: false });
    this._projectService = this._moduleRef.get('ProjectService', { strict: false });
    this._organizationService = this._moduleRef.get('OrganizationService', { strict: false });
    this._invitationService = this._moduleRef.get('InvitationService', { strict: false });
  }

  createToken(user: any) {
    return {
      access_token: this.jwtService.sign({ emailId: user.email, sub: user.id })
    };
  }

  async login(req: UserLoginWithPasswordRequest) {
    // check user
    const user = await this._userModel.findOne({
      emailId: req.emailId,
      password: req.password
    }).populate(['projects', 'organization', 'currentProject']).exec();

    if (user) {
      // update user last login provider to normal
      await user.updateOne({ $set: { lastLoginProvider: UserLoginProviderEnum.normal } });

      // return jwt token
      return {
        access_token: this.jwtService.sign({ sub: user.emailId, id: user.id })
      };
    } else {
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  /**
   * sign up with password
   * check basic validations
   * if invitationId and project id is present in request then it's invitation link accepted case
   * for this case first check user details by using user email address, then check project details and at last check organization details
   * then update user with the request model and set organization id
   * then update project and mark collaborator as invite accepted
   * then update organization and add this user as member
   * then expire all already sent invitations...
   * update invitation as invite accepted successfully
   * create jwt token and return it
   * @param user
   */
  async signUpWithPassword(user: User) {
    // validations
    this.checkSignUpValidations(user);

    const session = await this._userModel.db.startSession();
    session.startTransaction();

    try {
      const model = new User();
      model.emailId = user.emailId;
      model.username = model.emailId;
      model.password = user.password;
      model.firstName = user.firstName;
      model.lastName = user.lastName;
      model.locale = user.locale;
      model.status = UserStatus.Active;
      model.lastLoginProvider = UserLoginProviderEnum.normal;
      model.memberType = MemberTypes.alien;

      const jwtPayload = { sub: '', id: '' };

      /* check if user has invitationId && current project
      * it means user has accepted invitation of project
      */
      if (user.invitationId && user.currentProject && typeof user.currentProject === 'string') {

        // get invitation details
        const invitationDetails = await this._invitationService.getInvitationDetailsById(user.invitationId);

        if (!invitationDetails) {
          throw new BadRequestException('Invitation link is not valid!');
        } else {
          // check invitation link is valid or not
          this.checkInvitationLink(invitationDetails, user.currentProject, user.emailId);
        }

        // get user details by email id
        const userDetails = await this.getUserByEmailId(model.emailId);
        if (!userDetails) {
          throw new BadRequestException('User not found..');
        }

        // get project details by id
        const projectDetails = await this.getProjectById(user.currentProject);

        // check project details
        if (!projectDetails) {
          throw new BadRequestException('Project not found');
        } else {

          // check if user is added as collaborator in project and we are here only to update his basic details
          const userIndexInProjectCollaboratorIndex = projectDetails.members.findIndex(member => member.userId === userDetails._id.toString());
          if (userIndexInProjectCollaboratorIndex === -1) {
            throw new BadRequestException('User is not found in project or invalid invitation link, please contact support');
          }

          // get organization details by organization id that we got from project details
          const organizationDetails = await this.getOrganizationById(projectDetails.organization as string);

          if (!organizationDetails) {
            throw new BadRequestException('Organization not found');
          } else {
            // now everything seems ok start updating process

            // update user with model and set organization
            await this._userService.update(userDetails._id.toString(), {
              $set: {
                password: user.password,
                firstName: user.firstName,
                lastName: user.lastName,
                locale: user.locale,
                status: UserStatus.Active,
                lastLoginProvider: UserLoginProviderEnum.normal,
                memberType: MemberTypes.alien,
                currentOrganizationId: organizationDetails._id.toString(),
                currentProject: user.currentProject,
                $push: {
                  organizations: organizationDetails._id,
                  projects: user.currentProject
                }
              }
            }, session);

            // accept invitation and update project, organization and invitation
            await this.acceptInvitationProcessed(projectDetails, userIndexInProjectCollaboratorIndex, session, organizationDetails, userDetails, model.invitationId);
          }
        }

        // assign jwt payload
        jwtPayload.id = userDetails._id.toString();
        jwtPayload.sub = userDetails.emailId;
      } else {
        const newUser = await this._userService.create([model], session);
        jwtPayload.id = newUser[0].id;
        jwtPayload.sub = newUser[0].emailId;
      }

      await session.commitTransaction();
      session.endSession();

      return {
        access_token: this.jwtService.sign(jwtPayload)
      };
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  private async acceptInvitationProcessed(projectDetails: Project, userIndexInProjectCollaboratorIndex: number, session: ClientSession,
                                          organizationDetails: Organization, userDetails: User, invitationId: string) {
    // update project mark collaborator as invite accepted true
    await this._projectService.update(projectDetails._id.toString(), {
      $set: { [`members.${userIndexInProjectCollaboratorIndex}`]: { isInviteAccepted: true } }
    }, session);

    // update organization, add user as organization member
    await this._organizationService.update(organizationDetails._id.toString(), {
      $push: { members: userDetails._id }, $inc: { activeMembersCount: 1, billableMemberCount: 1 }
    }, session);

    // update invitations
    // find all already sent invitations excluding current invitation
    const alreadySentInvitationQuery = new MongooseQueryModel();
    alreadySentInvitationQuery.filter = {
      invitationToId: userDetails._id,
      projectId: projectDetails._id,
      isInviteAccepted: false,
      isExpired: false,
      _id: { $ne: invitationId }
    };

    // expire all already sent invitations for the current project excluding current invitation
    await this._invitationService.bulkUpdate(alreadySentInvitationQuery, {
      $set: {
        isExpired: true
      }
    }, session);

    // update current invitation and set invite accepted true
    await this._invitationService.update(invitationId, {
      $set: {
        isInviteAccepted: true,
        isExpired: true
      }
    }, session);
  }

  /**
   * verify given auth token with google
   * check if given token is valid
   * if valid then check if one is existing user or not of our app
   * if existing user update it's last login type and return jwt token
   * if new user create new user and return jwt token
   * @param token
   * @param invitationId
   */
  async verifyGoogleAuthToken(token: string, invitationId: string) {
    if (!token) {
      throw new BadRequestException('token not found');
    }

    try {
      const authTokenResult = await this.googleAuthTokenChecker(token);

      /*
        as per google if we receive token is valid
        we still need to check if token aud property contains our app client id
       */
      if (authTokenResult) {
        if (authTokenResult.aud === process.env.GOOGLE_CLIENT_ID) {
          let invitationDetails;
          let projectDetails;
          let organizationDetails;
          const jwtPayload = { sub: '', id: '' };

          // if invitation id is present then check invitation details and validity of invitation
          if (invitationId) {
            // get invitation details
            invitationDetails = await this._invitationService.getInvitationDetailsById(invitationId);

            if (!invitationDetails) {
              throw new BadRequestException('Invitation link is not valid!');
            } else {
              // check invitation link is valid or not
              this.checkInvitationLink(invitationDetails, invitationDetails.projectId, authTokenResult.email);
            }

            // get project details by id
            projectDetails = await this.getProjectById(invitationDetails.projectId);

            // check project details
            if (!projectDetails) {
              throw new BadRequestException('Project not found');
            } else {

              // check if user is added as collaborator in project and we are here only to update his basic details
              const userIndexInProjectCollaboratorIndex = projectDetails.members.findIndex(member => member.emailId === authTokenResult.email);
              if (userIndexInProjectCollaboratorIndex === -1) {
                throw new BadRequestException('User is not found in project or invalid invitation link, please contact support');
              }

              // get organization details by organization id that we got from project details
              organizationDetails = await this.getOrganizationById(projectDetails.organization as string);

              if (!organizationDetails) {
                throw new BadRequestException('Organization not found');
              }
            }

          }

          const session = await this._userModel.db.startSession();
          session.startTransaction();

          // get user details by email id from db
          const userFromDb = await this._userModel.findOne({
            emailId: authTokenResult.email
            // status: UserStatus.Active
          });

          if (!userFromDb) {
            const userNameFromGoogle = authTokenResult.name.split(' ');
            // create new user model
            const user = new User();
            user.emailId = authTokenResult.email;
            user.username = user.emailId;
            user.firstName = userNameFromGoogle[0] || '';
            user.lastName = userNameFromGoogle[1] || '';
            user.lastLoginProvider = UserLoginProviderEnum.google;
            user.profilePic = authTokenResult.picture;
            user.status = UserStatus.Active;
            user.memberType = MemberTypes.alien;

            // if invitation id is present than every thing is fine and set user's current project and current organization
            if (invitationId) {
              user.currentProject = projectDetails._id;
              user.currentOrganizationId = organizationDetails._id;
              user.projects = [projectDetails._id];
              user.organizations = [organizationDetails.id];
            }

            // save it to db
            const newUser = await this._userModel.create([user], session);
            jwtPayload.sub = newUser[0].emailId;
            jwtPayload.id = newUser[0].id;

          } else {
            // if user is already in db then update it's last login type to google
            // update user profile pic
            await this._userModel.updateOne({ _id: userFromDb._id },
              {
                $set: {
                  lastLoginProvider: UserLoginProviderEnum.google,
                  profilePic: authTokenResult.picture,
                  status: UserStatus.Active
                }
              }
            );

            // accept invitation and update project, organization and invitation
            // await this.acceptInvitationProcessed(projectDetails, userIndexInProjectCollaboratorIndex, session, organizationDetails, userFromDb, invitationId);

            // return jwt token
            return {
              access_token: this.jwtService.sign(jwtPayload)
            };
          }
        } else {
          throw new UnauthorizedException('Invalid user login');
        }
      }

      return authTokenResult;
    } catch (e) {
      throw e;
    }
  }

  private async googleAuthTokenChecker(token: string) {
    return new Promise<any>((resolve: Function, reject: Function) => {
      get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`, async (err: Error, res: Response, body: any) => {
        if (err) {
          reject(err);
        }

        body = JSON.parse(body);

        if (body.error) {
          reject(body.error);
        }

        resolve(body);
      });
    });
  }

  /**
   * check basic sign up with password validations
   * @param user
   */
  private checkSignUpValidations(user: User) {
    // check email address
    if (!user.emailId) {
      throw new BadRequestException('Email address is mandatory');
    } else {
      if (!emailAddressValidator(user.emailId)) {
        throw new BadRequestException('Invalid email address');
      }
    }

    // check password
    if (!user.password) {
      throw new BadRequestException('Password is mandatory');
    }

    // check first name
    if (!user.firstName) {
      throw new BadRequestException('First Name is mandatory');
    }

    // check last name
    if (!user.lastName) {
      throw new BadRequestException('last Name is mandatory');
    }
  }

  /**
   * get user by email id
   * @param emailId
   */
  private async getUserByEmailId(emailId: string) {
    const userQuery = new MongooseQueryModel();
    userQuery.filter = {
      emailId: emailId, $and: [{
        status: { $in: [null, undefined] }
      }, {
        lastLoginProvider: { $in: [null, undefined] }
      }]
    };
    userQuery.select = '_id emailId';
    userQuery.lean = true;

    return this._userService.findOne(userQuery);
  }

  /**
   * get project details by id
   * @param id
   */
  private async getProjectById(id: string) {
    const projectQuery = new MongooseQueryModel();

    projectQuery.filter = {
      _id: id, ...DEFAULT_QUERY_FILTER
    };
    projectQuery.select = '_id organization members';
    projectQuery.lean = true;

    return this._projectService.findOne(projectQuery);
  }

  /**
   * get organization details by id
   * @param id
   */
  private async getOrganizationById(id: string) {
    const organizationQuery = new MongooseQueryModel();

    organizationQuery.filter = {
      _id: id, ...DEFAULT_QUERY_FILTER
    };
    organizationQuery.lean = true;

    return this._organizationService.findOne(organizationQuery);
  }

  /**
   * check invitation link is valid or
   * check if invitation is expired or not
   * check if project id and project id in invitation are same
   * check if invitee user id and invitee user id in invitation are same
   * @param invitation
   * @param projectId
   * @param invitedToId
   */
  private checkInvitationLink(invitation: Invitation, projectId: string, invitedToId: string) {
    if (invitation.isExpired || invitationExpiryChecker(invitation.invitedAt)) {
      throw new BadRequestException('Invitation link expired');
    }

    if (invitation.projectId !== projectId) {
      throw new BadRequestException('Invitation project mismatch');
    }

    if (invitation.invitationTo !== invitedToId) {
      throw new BadRequestException('Invitation to user mismatch');
    }
  }

}

