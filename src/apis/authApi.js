import axiosInstance from "../libs/axios-instance";

export const authApi = {
  //sign in
  signIn: async (credentials) => {
    const { identifier, password, type } = credentials;
    const body =
      type === "email"
        ? { email: identifier, password }
        : { phone_number: identifier, password };

    try {
      const response = await axiosInstance.post("/v1/auth/login", body);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  //login with Google
  //forgot password
  //reset password

  //other auth related API calls can be added here
};
