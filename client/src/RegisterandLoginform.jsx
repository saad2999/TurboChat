import axios from 'axios';
import React from 'react'
import { useContext } from 'react';
import { userContext } from './usercontext';

function RegisterandLoginform() {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoginorRegister, setIsLoginorRegister] = React.useState('register');
    const {setUsername:setLoginUsername,setId}=useContext(userContext)
   async function handleSubmit(e){
    e.preventDefault()
    const url=isLoginorRegister==='register'?'register':'login'
      const {data}=await axios.post(url,{username,password})
      setLoginUsername(username) 
      setId(data.id)
    }
  return (
    <div className='bg-blue-50 flex h-screen items-center'>
     
  <form className='w-64 mx-auto' method='post' onSubmit={handleSubmit}>
  <p className='flex mb-10 text-3xl w-80 '>{isLoginorRegister==='register'?'Register':'Login'} to <span className='text-mygreen font-bold'>Turbo Chat</span></p>
    <input
      type="text"
      placeholder="username"
      className="block w-full rounded-md p-2 mb-2 border "
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      autoComplete="username"
    />

    <input
      type="password"
      placeholder="Password"
      className="block w-full rounded-md p-2 mb-2 border"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      autoComplete="current-password"
    />
    <button className='bg-mygreen text-white block w-full rounded-md p-2'>

      {isLoginorRegister==='register'?'Register':'Login'}
      </button>
      {isLoginorRegister==="register" &&(
        <div className=" mt-2 w-80 flex">
      Already have an account?
      <button className='text-mygreen font-medium pl-2' onClick={()=>setIsLoginorRegister('login')}> Login here</button>
    
    </div>
      )}
      {isLoginorRegister==="login" &&(
        <div className=" w-80 flex mt-2">
      Do not have an account?
      <button className='text-mygreen font-medium pl-2' onClick={()=>setIsLoginorRegister('register')}>Register</button>
    
    </div>
      )}
    
  </form>
</div>
  )
}

export default RegisterandLoginform
