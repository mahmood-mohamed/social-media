import type { Request, Response, NextFunction } from 'express';
import { ILoginDTO, IRegisterDTO } from './auth.dto';
import { ConflictError } from '../../utils/error';
import { UserRepository } from '../../DB/model/user/user.repository';
import { AuthFactoryService } from './factory';
import { IUser } from '../../utils/common/interface';
import { sendMail } from '../../utils/email';
import { comparePassword } from '../../utils/hash';

// abstract.repository pattern
class AuthService {
    private userRepository = new UserRepository();
    private authFactoryService = new AuthFactoryService();
    constructor() {};

    register = async (req: Request, res: Response, next: NextFunction) => {
        // registration logic
        const registerDTO: IRegisterDTO = req.body

        console.log(registerDTO );
        
        const userExists = await this.userRepository.userExists({ email: registerDTO.email }); // {User Document} | null 
        if (userExists) {
            throw new ConflictError('User with this email already exists');
        };

        // prepare user entity using factory pattern
        const newUser = this.authFactoryService.register(registerDTO);
        console.log( 'newUser >> ',newUser);
        
        // create user in DB
        const createdUser = await this.userRepository.create(newUser as unknown as Partial<IUser>);
        console.log( 'createdUser >> ',createdUser);
        
        // Send verification email
        sendMail({
            to: registerDTO.email, 
            subject: "Verify your email", 
            text: `Your OTP is ${newUser.otp}`
        });

        return res.status(201).json({ 
            success: true, 
            message: 'User registered successfully', 
            data: createdUser
        });
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
        // login logic
        const loginDTO: ILoginDTO = req.body;

        const user = await this.userRepository.userExists({ email: loginDTO.email });
        if (!user) {
            throw new ConflictError('User not found');
        }
        // if (!user.isVerified) {
        //     throw new ConflictError('User is not verified');
        // }

        const isValidPassword = comparePassword(loginDTO.password, user.password);
        if (!isValidPassword) {
            throw new ConflictError('Invalid password');
        }

        return res.status(200).json({ 
            success: true, 
            message: 'User logged in successfully', 
            data: user
        });
    }
};


export default new AuthService();
