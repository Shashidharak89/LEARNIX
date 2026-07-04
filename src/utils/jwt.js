import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

export function generateToken(userId, expiresIn = "30d") {
    return jwt.sign({ userId }, SECRET_KEY, { expiresIn });
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
}
