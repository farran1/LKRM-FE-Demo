import { Request, Response } from 'express'
import z from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { registerSchema } from '@/validations/register'
import { AuthRequest } from '@/middlewares/auth'
import { SESSION_EXPIRE, SESSION_MILISECOND_EXPIRE } from '@/utils/constants'
import { db } from '@/services/database'

export class AuthController {
  async login(req: Request, res: Response) {
    const validateSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    })

    const validate = validateSchema.safeParse(req.body)
    if (!validate.success) {
      // return res.status(400).json({ error: validate.error.flatten() })
      // const errors = validate.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      // return res.status(400).json({ errors })
      const formattedErrors = validate.error.format()
      return res.status(400).json({
        errors: {
          email: formattedErrors.email?._errors || ['Required'],
          password: formattedErrors.password?._errors || ['Required'],
        },
      })
    }

    const { email, password } = validate.data

    try {
      const user = await db.user.findUnique({ where: { email } })
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }
  
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }
  
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: SESSION_EXPIRE }
      )
  
      res
        .cookie('access_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: SESSION_MILISECOND_EXPIRE, // expired in 4h
        })
        .json({ message: 'Login success' })
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async register(req: Request, res: Response) {
    const validation = registerSchema.safeParse(req.body)

    if (!validation.success) {
      const errors = validation.error.format()
      return res.status(400).json({
        errors: {
          email: errors.email?._errors || [],
          password: errors.password?._errors || [],
        },
      })
    }

    const { email, password } = req.body

    try {
      // Check for existing user
      const existingUser = await db.user.findUnique({ where: { email } })
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser = await db.user.create({
        data: {
          username: email,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true, // or false by default
          createdBy: 0,
          updatedBy: 0,
          profileId: 0 // Will attach profile later in db
        },
      })

      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
        },
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  async waitlist(req: Request, res: Response) {
    const validateSchema = z.object({
      firstName: z.string().min(1, "First name is required").max(20),
      lastName: z.string().min(1, "Last name is required").max(20),
      email: z.string().email("Invalid email"),
      phoneNumber: z.string().min(6, "Phone number is required"),
      institute: z.string().min(1, "Institute is required").max(255),
    })

    const validate = validateSchema.safeParse(req.body)
    if (!validate.success) {
      // return res.status(400).json({ error: validate.error.flatten() })
      // const errors = validate.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      // return res.status(400).json({ errors })
      const formattedErrors = validate.error.format()
      return res.status(400).json({
        errors: {
          firstName: formattedErrors.firstName?._errors || [],
          lastName: formattedErrors.lastName?._errors || [],
          email: formattedErrors.email?._errors || [],
          phoneNumber: formattedErrors.phoneNumber?._errors || [],
          institute: formattedErrors.institute?._errors || [],
        },
      })
    }

    const { firstName, lastName, email, phoneNumber, institute } = validate.data

    // Check for existing user
    const existingProfile = await db.profile.findUnique({ where: { email } })
    if (existingProfile) {
      return res.status(409).json({ error: 'Email already registered' })
    }
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    try {
      const profile = await db.profile.create({
        data: {
          firstName,
          lastName,
          email,
          phoneNumber,
          institute,
          createdBy: 0,
          updatedBy: 0
        },
      })
  
      return res.status(201).json({ data: profile })
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  async me(req: AuthRequest, res: Response) {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          isActive: true,
          createdAt: true,
        },
      })

      if (!user) {
        return res.status(404).json({ error: "User not found" })
      }

      res.json({ user })
    } catch (error) {
      res.status(500).json({ error: "Internal server error" })
    }
  }
}