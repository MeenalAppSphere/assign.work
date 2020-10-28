// basic user details that we will be fetched when user details is queried using mongo db aggregate
export const basicUserDetailsForAggregateQuery = {
  'emailId': 1, 'userName': 1, 'firstName': 1, 'lastName': 1, 'profilePic': 1
};


// basic user details that we will be fetched when user details is queried using mongo db aggregate
export const basicUserPopulationDetails = 'emailId userName firstName lastName profilePic _id';
