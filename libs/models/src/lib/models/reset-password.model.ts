export class ResetPasswordModel {
  id?: string;
  _id?: string;
  emailId: string;
  code: string;
  resetPasswordAt: Date;
  isDeleted?: boolean;
  isExpired: boolean;
}

export class ResetPasswordVerifyModel {
  code: string;
  emailId: string;
  password: string;
}
