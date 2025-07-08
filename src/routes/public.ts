import { Router, Request, Response } from 'express'
// import { UserController } from '../controllers/UserController.js'
// import { UploadController } from '../controllers/UploadController.js'
import { HomeController } from '@/controllers/home-controller'
// import upload from '../middlewares/upload.js'
import { AuthController } from '@/controllers/auth-controller'

const router = Router()
const homeController = new HomeController()
const authController = new AuthController()

// User routes
// router.get('/users', async (req: Request, res: Response) => {
//   await userController.getUserByEmail(req, res)
// })

// // Upload routes
// router.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
//   await uploadController.uploadImage(req, res)
// })

router.get('/', async (req: Request, res: Response) => {
  await homeController.index(req, res)
})
router.post('/login', async (req: Request, res: Response) => {
  await authController.login(req, res)
})
// router.post('/register', async (req: Request, res: Response) => {
//   await authController.register(req, res)
// })
router.post('/waitlist', async (req: Request, res: Response) => {
  await authController.waitlist(req, res)
})

export default router 