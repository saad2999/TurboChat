import React from 'react'
import Avatar from './Avatar'


function Contact({id,onClick,username,seleced,online}) {
  return (
    <div onClick={()=>{onClick(id)}} className={'border-b border-gray-100 flex gap-2 items-center cursor-pointer '+(seleced?'bg-green-200': '')} key={id}>
        {seleced&&(
          <div className='w-1 h-12 bg-mygreen rounded-r-md'></div>
        )}
       <div className='py-2 pl-4 flex gap-2 items-center'>
       <Avatar online={online} username={username} userId={id}/>
       <span className='text-gray-800'> {username}</span>
       </div>
      </div>
  )
}

export default Contact
