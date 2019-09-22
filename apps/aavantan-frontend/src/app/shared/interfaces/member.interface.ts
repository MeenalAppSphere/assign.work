export interface Member {
  _id?:string;
  memberId?: string;
  emailId: string;
  isEmailSent?: boolean;
  isInviteAccepted?: boolean;
  memberType?: string;
  unconfirmed?: boolean;
  activated?: boolean;
  orgMemberType?:string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  initial?: string;
  createdAt?: Date;
  updatedAt?: Date;
  profilePic?:string;
}
