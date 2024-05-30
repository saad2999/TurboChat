import React from 'react'

export default function Avatar({username,userId,online}) {
    const colors=['bg-teal-200 ','bg-red-200 ','bg-green-200','bg-purple-200 ','bg-yellow-200','bg-blue-200'];
    const userIdBase10=parseInt(userId,16);
    const color=colors[userIdBase10%colors.length];
  return (
    
    <div>
        <div className={'w-8 h-8 bg-red-200 rounded-full relative flex items-center justify-center '+color}>
           <span className='opacity-70'> {username[0]}</span>
           {online&&<div className='absolute bottom-0 right-0 bg-green-500 w-3 h-3 rounded-full border border-white'></div>}
           {!online&&<div className='absolute bottom-0 right-0 bg-orange-500 w-3 h-3 rounded-full border border-white'></div>}
        </div>

    </div>
  )
}
