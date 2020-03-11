// basic user details that we will be fetched when user details is queried using mongo db aggregate
export const basicUserDetailsForAggregateQuery = {
  'emailId': 1, 'userName': 1, 'firstName': 1, 'lastName': 1, 'profilePic': 1
};
