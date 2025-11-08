import { IUser } from "../common";

/**
 * -> This function is used to format user data
 * @param user IUser
 * @return userInfo {_id, fullName, firstName, lastName, profilePicture} 
 *  */
export const formatUser = (user: IUser | any) => {
  if (!user) return null;

  // ✅ if user is deleted then return deleted user
  const isDeleted = user.isDeleted || false;

  if (isDeleted) {
    return {
      id: user._id,
      fullName: "Deleted User",
      profilePicture: null,
    };
  }

  return {
    id: user._id,
    fullName: user.fullName || user.firstName + " " + user.lastName || null,
    profilePicture: user.profilePicture?.secure_url || null,
  };
};
