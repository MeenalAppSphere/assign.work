import { BadRequestException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  DbCollection,
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
import { emailAddressValidator, isInvitationExpired } from '../shared/helpers/helpers';

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

  /**
   * login with emailId and password
   * @param req
   */
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

    // start session
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

      // get user details by emailId id
      const userDetails = await this.getUserByEmailId(model.emailId);

      // user exist or not
      if (userDetails) {
        /*
        * check if user has invitationId && current project
        * it means user has accepted invitation of project
        */
        if (user.invitationId) {

          // get invitation details
          const invitationDetails = await this._invitationService.getFullInvitationDetails(user.invitationId);

          // check basic validations for invitation link
          this.invitationLinkBasicValidation(invitationDetails, userDetails.emailId);

          // now everything seems ok start invitation accepting process
          // accept invitation and update project, organization and invitation
          await this.acceptInvitationProcess(invitationDetails.project, session, invitationDetails.organization, userDetails, user.invitationId);

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
              currentOrganizationId: invitationDetails.organization._id.toString(),
              currentProject: invitationDetails.project._id.toString()
            },
            $push: {
              organizations: invitationDetails.organization._id.toString(),
              projects: invitationDetails.project._id.toString()
            }
          }, session);

          // expire all already sent invitations
          await this._invitationService.expireAllPreviousInvitation(userDetails.emailId, session);

          // assign jwt payload
          jwtPayload.id = userDetails._id.toString();
          jwtPayload.sub = userDetails.emailId;
        } else {
          // check if new user have pending invitations
          const pendingInvitations = await this.getAllPendingInvitations(userDetails.emailId);

          // loop over pending invitations and accept all invitations
          if (pendingInvitations.length) {

            // prepare update user doc
            let updateUserDoc: any = {
              $set: {
                password: user.password,
                firstName: user.firstName,
                lastName: user.lastName,
                locale: user.locale,
                status: UserStatus.Active,
                lastLoginProvider: UserLoginProviderEnum.normal,
                memberType: MemberTypes.alien
              }
            };

            userDetails.organizations = userDetails.organizations ? userDetails.organizations : [];
            userDetails.projects = userDetails.projects ? userDetails.projects : [];
            // handle pending invitations
            await this.handlePendingInvitations(pendingInvitations, userDetails, session, updateUserDoc);

            // add project and organization to update update user doc variable which is going to update user profile
            updateUserDoc = {
              ...updateUserDoc, $push: {
                organizations: { $each: userDetails.organizations },
                projects: { $each: userDetails.projects }
              }
            };

            // update user in db
            await this._userService.update(userDetails._id.toString(), updateUserDoc, session);

            // expire all already sent invitations
            await this._invitationService.expireAllPreviousInvitation(userDetails.emailId, session);
          }

          // assign jwt payload
          jwtPayload.id = userDetails._id;
          jwtPayload.sub = userDetails.emailId;
        }
      } else {
        // user not exist but invitation link then it's malicious invitation link
        if (user.invitationId) {
          throw new BadRequestException('Invalid invitation link');
        }

        // create new user and assign jwt token
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

    const session = await this._userModel.db.startSession();
    session.startTransaction();

    try {
      const authTokenResult = await this.googleAuthTokenChecker(token);

      /*
        as per google if we receive token is valid
        we still need to check if token aud property contains our app client id
       */
      if (authTokenResult) {

        const userNameFromGoogle = authTokenResult.name.split(' ');

        if (authTokenResult.aud === process.env.GOOGLE_CLIENT_ID) {

          const jwtPayload = { sub: '', id: '' };

          // get user details by email id from db
          const userDetails = await this.getUserByEmailId(authTokenResult.email);

          // check user exist
          if (userDetails) {
            if (invitationId) {

              // get invitation details
              const invitationDetails = await this._invitationService.getFullInvitationDetails(invitationId);
              // check basic validations for invitation link
              this.invitationLinkBasicValidation(invitationDetails, userDetails.emailId);

              // now everything seems ok start invitation accepting process
              // accept invitation and update project, organization and invitation
              await this.acceptInvitationProcess(invitationDetails.project, session, invitationDetails.organization, userDetails, invitationId);

              // if user is already in db then update it's last login type to google
              // add project and organization
              await this._userService.update(userDetails._id.toString(), {
                $set: {
                  firstName: userNameFromGoogle[0] || '',
                  lastName: userNameFromGoogle[1] || '',
                  lastLoginProvider: UserLoginProviderEnum.google,
                  profilePic: authTokenResult.picture,
                  status: UserStatus.Active,
                  currentOrganizationId: invitationDetails.organization._id.toString(),
                  currentProject: invitationDetails.project._id.toString()
                },
                $push: {
                  organizations: invitationDetails.organization._id.toString(),
                  projects: invitationDetails.project._id.toString()
                }
              }, session);

              // expire all already sent invitations
              await this._invitationService.expireAllPreviousInvitation(userDetails.emailId, session);

              // assign jwt payload
              jwtPayload.sub = userDetails.emailId;
              jwtPayload.id = userDetails._id;
            } else {

              // check if new user have pending invitations
              const pendingInvitations = await this.getAllPendingInvitations(userDetails.emailId);

              // loop over pending invitations and accept all invitations
              if (pendingInvitations.length) {

                // prepare update user doc
                let updateUserDoc: any = {
                  $set: {
                    firstName: userNameFromGoogle[0] || '',
                    lastName: userNameFromGoogle[1] || '',
                    lastLoginProvider: UserLoginProviderEnum.google,
                    profilePic: authTokenResult.picture,
                    status: UserStatus.Active
                  }
                };

                userDetails.organizations = userDetails.organizations ? userDetails.organizations : [];
                userDetails.projects = userDetails.projects ? userDetails.projects : [];
                // handle pending invitations
                await this.handlePendingInvitations(pendingInvitations, userDetails, session, updateUserDoc);

                // add project and organization to update update user doc variable which is going to update user profile
                updateUserDoc = {
                  ...updateUserDoc, $push: {
                    organizations: { $each: userDetails.organizations },
                    projects: { $each: userDetails.projects }
                  }
                };

                // update user in db
                await this._userService.update(userDetails._id.toString(), updateUserDoc, session);

                // expire all already sent invitations
                await this._invitationService.expireAllPreviousInvitation(userDetails.emailId, session);
              } else {
                // normal sign in
                await this._userService.update(userDetails._id.toString(), {
                  $set: {
                    firstName: userNameFromGoogle[0] || '',
                    lastName: userNameFromGoogle[1] || '',
                    lastLoginProvider: UserLoginProviderEnum.google,
                    profilePic: authTokenResult.picture,
                    status: UserStatus.Active
                  }
                }, session);
              }

              // assign jwt payload
              jwtPayload.id = userDetails._id;
              jwtPayload.sub = userDetails.emailId;
            }
          } else {
            // user not exist but invitation link then it's malicious invitation link
            if (invitationId) {
              throw new BadRequestException('Invalid invitation link');
            }

            // new user
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

            // save it to db
            const newUser = await this._userModel.create([user], session);
            jwtPayload.sub = newUser[0].emailId;
            jwtPayload.id = newUser[0].id;
          }

          await session.commitTransaction();
          session.endSession();
          // return jwt token
          return {
            access_token: this.jwtService.sign(jwtPayload)
          };
        } else {
          throw new UnauthorizedException('Invalid user login');
        }
      } else {
        throw new UnauthorizedException('Invalid user login');
      }
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  /**
   * google token checker
   * @param token
   */
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
      emailId: emailId
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

    const projectDetails = await this._projectService.findOne(projectQuery);
    if (!projectDetails) {
      throw new BadRequestException('Project not found');
    }
    return projectDetails;
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

    const organizationDetails = await this._organizationService.findOne(organizationQuery);
    if (!organizationDetails) {
      throw new BadRequestException('Organization not found');
    }
    return organizationDetails;
  }

  /**
   * handle pending invitations
   * loop over pending invitations
   * get invitation details, check validations for invitation link
   * accept invitation one by one
   * add project and organization in user object
   * @param pendingInvitations
   * @param userDetails
   * @param session
   * @param updateUserDoc
   */
  private async handlePendingInvitations(pendingInvitations: any[], userDetails: User & Document, session: ClientSession, updateUserDoc: any) {
    for (let i = 0; i < pendingInvitations.length; i++) {

      const invitationDetails = await this._invitationService.getFullInvitationDetails(pendingInvitations[i]._id);

      // check basic validations for invitation link
      this.invitationLinkBasicValidation(invitationDetails, userDetails.emailId);

      // accept invitation process
      await this.acceptInvitationProcess(invitationDetails.project, session, invitationDetails.organization, userDetails, invitationDetails._id);

      // if pending invitation length is only one then set that project as current project
      if (pendingInvitations.length === 1) {
        updateUserDoc.$set['currentOrganizationId'] = invitationDetails.organization._id.toString();
        updateUserDoc.$set['currentProject'] = invitationDetails.project._id.toString();
      }

      /* push organization and project to updated user doc */
      // push project
      userDetails.projects.push(invitationDetails.project._id.toString());

      // push organization
      // check if organization is not already pushed
      const organizationAlreadyPushed = userDetails.organizations && userDetails.organizations.some(organization => {
        return organization === invitationDetails.organization._id.toString();
      });

      if (!organizationAlreadyPushed) {
        userDetails.organizations.push(invitationDetails.organization._id.toString());
      }
    }
  }

  /**
   * check invitation link is valid or
   * check if invitation is expired or not
   * check if user emailId and invitee user id in invitation are same
   * @param invitationDetails
   * @param userEmailId
   */
  private invitationLinkBasicValidation(invitationDetails, userEmailId: string) {
    if (!invitationDetails) {
      throw new BadRequestException('Invalid invitation link');
    } else {
      if (isInvitationExpired(invitationDetails.invitedAt)) {
        throw new BadRequestException('Invitation link has been expired! please request a new one');
      }

      // if invitation id present then user is already created so get user details by email id
      if (invitationDetails.invitationToEmailId !== userEmailId) {
        throw new BadRequestException('Invalid invitation link! this invitation link is not for this email id');
      }
    }
  }

  /**
   * accept invitation process
   * update project, update organization
   * accept invitation, expire all already sent invitations
   * @param projectDetails
   * @param session
   * @param organizationDetails
   * @param userDetails
   * @param invitationId
   */
  private async acceptInvitationProcess(projectDetails: Project, session: ClientSession,
                                        organizationDetails: Organization, userDetails: User, invitationId: string) {

    // check if user is added as collaborator in project and we are here only to update his basic details
    const userIndexInProjectCollaboratorIndex = projectDetails.members.findIndex(member => member.emailId === userDetails.emailId);

    // update project mark collaborator as invite accepted true
    await this._projectService.update(projectDetails._id.toString(), {
      $set: { [`members.${userIndexInProjectCollaboratorIndex}.isInviteAccepted`]: true }
    }, session);

    // update organization, add user as organization member
    const isAlreadyOrganizationMember = userDetails.organizations && userDetails.organizations.some((organization => {
      return userDetails.organizations.includes(organization.toString());
    }));

    if (!isAlreadyOrganizationMember) {
      await this._organizationService.update(organizationDetails._id.toString(), {
        $push: { members: userDetails._id }, $inc: { activeMembersCount: 1, billableMemberCount: 1 }
      }, session);
    }

    // update current invitation and set invite accepted true
    await this._invitationService.acceptInvitation(invitationId, session);
  }

  /**
   * get all pending invitation of user by email id
   * @param emailId
   */
  private async getAllPendingInvitations(emailId) {
    let pendingInvitations = await this._invitationService.getAllPendingInvitations(emailId);

    if (pendingInvitations && pendingInvitations.length) {
      // loop over all pending invitations and filter out expired invitations
      pendingInvitations = pendingInvitations.filter(invitation => {
        // if link is expired add it to expired invitation
        return !isInvitationExpired(invitation.invitedAt);
      });
      return pendingInvitations;
    } else {
      return [];
    }
  }
}

