import { Request, Response } from 'express';
import AuthService from '../services/auth.service';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { phoneNumber, password, fullName, gmail } = req.body;

    const user = await AuthService.registerUser(
        phoneNumber,
        password,
        fullName,
        gmail,
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { user },
                'User registered successfully. Please verify your phone number.'
            )
        );
});

export const verifyPhoneNumber = asyncHandler(async (req: Request, res: Response) => {
    const { phone_number, otp } = req.body;

    await AuthService.verifyPhoneNumber(phone_number, otp);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Phone number verified successfully'));
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { phoneNumber, password } = req.body;

    const { user, tokens } = await AuthService.loginUser(phoneNumber, password);

    // Set cookies
    res.cookie('accessToken', tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user },
                'User logged in successfully'
            )
        );
});

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        throw new ApiError(401, 'Refresh token is required');
    }

    const tokens = await AuthService.refreshAccessToken(refreshToken);

    // Set new cookies
    res.cookie('accessToken', tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                'Access token refreshed successfully'
            )
        );
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
        await AuthService.logoutUser(req.user.id, refreshToken);
    }

    // Clear cookies
    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

export const upgradeToPremium = asyncHandler(async (req: Request, res: Response) => {
    const { duration_months } = req.body;

    const user = await AuthService.upgradeToPremium(req.user.id, duration_months);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user },
                'User upgraded to premium successfully'
            )
        );
});

export const checkPremiumStatus = asyncHandler(async (req: Request, res: Response) => {
    const isPremium = await AuthService.checkPremiumStatus(req.user.id);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPremium },
                'Premium status checked successfully'
            )
        );
}); 