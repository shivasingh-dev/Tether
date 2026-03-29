import React from 'react'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import {  motion } from "motion/react"
import { slideLeft } from '../../Services/Animation'

const Welcome = () => {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 h-full w-full'>
      <div className='bg-[#020818] min-h-screen'>
        <Navbar />
        <div className='py-5 w-6/7 mx-auto text-[#e5e7eb] flex flex-col gap-6'>
          <motion.span {...slideLeft} className='bg-linear-to-r from-[blue] to-[purple] text-md w-fit px-4   py-1.5 rounded-full'>Now Available</motion.span>
          <motion.span {...slideLeft} className="bg-linear-to-r from-[#60a5fa] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-transparent text-4xl font-bold mt-3" >
            Communication <br /> for Indians
          </motion.span>
          <motion.span {...slideLeft} className='w-3/4 text-[17px] my-3'>
            Connect with the people who matter most 💙. Messages 💬, calls 📞, and stories 📸 — always with you ✨
          </motion.span>
          <Card />
        </div>
      </div>
      <div>Image</div>
    </div>
  )
}

export default Welcome
