import React from 'react'
import Logo from '../../src/assets/ic_launcher.png'
import { ArrowRight } from 'lucide-react'
import { slideDown } from '../Services/Animation'
import { motion } from "motion/react"

const Navbar = ({ setFormOpen, formOpen }) => {
  return (
      <motion.div {...slideDown} className='flex justify-between w-7/8 text-[#e5e7eb] mx-auto py-8'>
        <div className='flex items-center gap-1 '>
          <img className='w-9' src={Logo} alt="Logo" />
          <span className='font-bold text-md' style={{
            textShadow: '0 0 12px rgba(41,121,255,0.9), 0 0 30px rgba(41,121,255,0.6), 0 0 60px rgba(124,58,237,0.5)'
          }}>
            Tether
          </span>
        </div>
        <div onClick={() => setFormOpen(true)} className='flex items-center bg-linear-to-r from-[#2979ff] to-[#7c3aed] rounded-full px-4 py-2 cursor-pointer hover:scale-106 transform ease-in-out transition duration-500 shadow-[0_4px_12px_rgba(0,0,0,0.4),0_8px_30px_rgba(41,121,255,0.5),0_12px_50px_rgba(124,58,237,0.35)] hover:shadow-[0_5px_16px_rgba(0,0,0,0.45),0_8px_40px_rgba(41,121,255,0.65),0_15px_60px_rgba(124,58,237,0.5)]'>
          <span className='font-bold text-md' >Get Started</span>
          <ArrowRight className='h-5' />
        </div>
      </motion.div>
  )
}

export default Navbar
