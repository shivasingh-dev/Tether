import React, { useState } from 'react'
import { X, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react' 
import { toast } from 'react-toastify';
import * as Yup from 'yup'
import { useFormik } from 'formik'
import { loginWithEmail } from '../Services/UserService.js'
import { motion } from "motion/react"
import { slideDown } from '../Services/Animation.js'
import { useNavigate } from 'react-router-dom';
import useUserStore from '../Store/useUserStore.js';

const loginInitialValues = {
  email: "",
  password: "",
}

const LoginPopup = ({ setFormOpen }) => {

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const setUser = useUserStore((state) => state.setUser)

  const navigate = useNavigate()

  const loginSchema = Yup.object({
    email: Yup.string().email("Invalid Email address").required("Email is required"),
    password: Yup.string().required("Password is required").min(6, "Must be at least 6 characters"),
  })

  const formik = useFormik({
    initialValues: loginInitialValues,
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      try {
        setIsLoading(true)
        const response = await loginWithEmail(values.email, values.password)
        if (response.success) {
          const userData = response.user
          setUser(userData)
          toast.success("Login Successfully")
            navigate('/')
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Invalid Email Id or password")
      } finally {
        setIsLoading(false)
      }
    }
  })

  return (
    <motion.div {...slideDown} className='fixed inset-0 flex items-center justify-center backdrop-blur-md z-50 px-4'>
      <div className='relative flex flex-col h-auto max-h-[95vh] w-full max-w-2xl bg-linear-to-br from-[#05164a] via-[#050a1f] to-[#0a1f44] text-[#c9c9c9] rounded-2xl shadow-[0_0_60px_rgba(59,130,246,0.3)] overflow-hidden'>

        {/* Header */}
        <div className='p-6 flex items-center justify-between border-b border-blue-900/50'>
          <h1 className='text-xl lg:text-2xl font-bold text-white'>Welcome to Tether</h1>
          <button
            onClick={() => setFormOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className='p-8 flex flex-col items-center overflow-y-auto'>
          <p className='text-center md:text-base text-blue-200/70 mb-8'>
            Use the email & password from your Tether mobile app
          </p>

          <form onSubmit={formik.handleSubmit} className='w-full max-w-md space-y-5'>

            {/* Email Field */}
            <div className='space-y-2'>
              <label className='text-md font-medium text-blue-100'>Email address</label>
              <div className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-all ${formik.errors.email && formik.touched.email ? 'border-red-500 bg-red-500/5' : 'border-blue-600 focus-within:border-blue-400 bg-[#06234f]'}`}>
                <Mail className="w-5 h-5 text-blue-400" />
                <input
                  name='email'
                  type="email"
                  autoComplete='off'
                  placeholder='xyz@gmail.com'
                  className='bg-transparent outline-none w-full text-white placeholder:text-blue-300/30'
                  {...formik.getFieldProps('email')}
                />
              </div>
              {formik.errors.email && formik.touched.email && (
                <p className='text-xs text-red-400 ml-1'>{formik.errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className='space-y-2'>
              <label className='text-md font-medium text-blue-100'>Password</label>
              <div className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-all ${formik.errors.password && formik.touched.password ? 'border-red-500 bg-red-500/5' : 'border-blue-600 focus-within:border-blue-400 bg-[#06234f]'}`}>
                <Lock className="w-5 h-5 text-blue-400" />
                <input
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  className='bg-transparent outline-none w-full text-white placeholder:text-blue-300/30'
                  autoComplete='off'
                  {...formik.getFieldProps('password')}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='text-blue-400 hover:text-blue-200 transition-colors cursor-pointer'
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {formik.errors.password && formik.touched.password && (
                <p className='text-xs text-red-400 ml-1'>{formik.errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={isLoading || !formik.isValid}
              className={`w-full py-4 mt-4 font-bold text-white rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer ${isLoading ? 'bg-blue-800 opacity-70 cursor-not-allowed' : 'bg-linear-to-r from-[#2979ff] to-[#7c3aed] hover:shadow-[0_0_20px_rgba(41,121,255,0.4)] active:scale-95'}`}
            >
              {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : 'Sign in to Tether'}
            </button>

            <p className='text-center text-lg text-gray-400'>
              Don't have an account?
              <a href="https://play.google.com/store/" target='_blank' rel="noreferrer" className='text-blue-400 hover:underline ml-1'>Download app</a>
            </p>
          </form>

          <p className='text-md text-center text-blue-300/40 mt-8'>
            Web login requires an account created via Tether mobile app
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default LoginPopup