import bcrypt from "bcryptjs";
import { User } from "../models/user.model";
import { RegisterInput, LoginInput, AuthResponse } from "../types/auth.types";
import { generateToken } from "../utils/jwt";

export const registerUser = async (
    input: RegisterInput
): Promise<AuthResponse> => {
    const { name, email, password } = input;
    const role = "staff" as const;
    const existingUser = await User.findOne({
        email: email.toLowerCase(),
    });

    if (existingUser) {
        throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
    });

    const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
    });

    return {
        token,
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};

export const loginUser = async (
    input: LoginInput
): Promise<AuthResponse> => {
    const { email, password } = input;

    const user = await User.findOne({
        email: email.toLowerCase(),
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        throw new Error("Invalid email or password");
    }

    const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
    });

    return {
        token,
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};