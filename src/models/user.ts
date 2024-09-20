import mongoose, { Schema, Document, Model } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  // properties
  name: string;
  email: string;
  photo: string;
  password: string;
  passwordConfirm: string | undefined;
  passwordChangedAt: Date;

  //  methods
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  changedPasswordAfter(JwtTimestamp: number): Promise<boolean>;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A user must have a name"],
    },
    email: {
      type: String,
      required: [true, "A user must have an email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Provide a valid email address"],
    },
    photo: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "A user must have a password"],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "A user must have a confirm password"],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Confirm password should be the same as the password field",
      },
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  {
    strict: true,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// methods
userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = async function (
  JwtTimestamp: number
): Promise<boolean> {
  if (!this.passwordChangedAt) {
    return false;
  }

  const changedPassword = Math.floor(this.passwordChangedAt.getTime() / 1000);

  return JwtTimestamp < changedPassword;
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
