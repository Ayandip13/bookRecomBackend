import mongoose from "mongoose";

export const ConnectDB = async () => {
  try {
    const con = await mongoose.connect(process.env.MONGO_URI);
    console.log(`DB have Connected at ${con.connection.host}`);
  } catch (error) {
    console.log("DB has not connected", error);
    process.exit(1); //Exit with failure
  }
};
