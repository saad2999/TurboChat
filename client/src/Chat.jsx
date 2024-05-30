import React, { useContext, useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import { userContext } from './usercontext';
import { uniqBy } from 'lodash';
import axios from 'axios';
import Contact from './Contact';
import './Chat.css'; 
import { GoogleGenerativeAI } from "@google/generative-ai";

function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const { id ,setId,setUsername,username} = useContext(userContext);
  const divUnderMessage = useRef();

  useEffect(() => {
    connectToWs();
  }, []);

  function connectToWs() {
    const ws = new WebSocket('ws://localhost:3000');
    setWs(ws);
    ws.addEventListener('message', handleMessage);
    ws.addEventListener('close', () => {
      setTimeout(() => {
        console.log('trying to reconnect');
        connectToWs();
      }, 1000);
    });
  }

  function showOnlinePeople(peopleArr) {
    const people = {};
    peopleArr.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  function handleMessage(e) {
    const messagedata = JSON.parse(e.data);
    if ('online' in messagedata) {
      showOnlinePeople(messagedata.online);
    } else if('text' in messagedata)
      {
        if(messagedata.sender===selectedUserId)
        {
          setMessages((prev) => [...prev, { ...messagedata }]);
        }
      
    }
  }

  function sendMessage(e,file=null) {
    if (e) e.preventDefault();

    const urlPattern = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/;
    const formattedMessage = newMessageText.replace(urlPattern, (match) => {
      return `<a href="${match}" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });
  
    const messageData = {
      to: selectedUserId,
      text: formattedMessage,
    };
  
    if (file) {
      messageData.file = file;
    }
  
    ws.send(JSON.stringify(messageData));
  
    setMessages((prev) => [
      ...prev,
      {
        text: formattedMessage,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
        file: file ? file.info : null,
      },
    ]);
  
    setNewMessageText('');
  }
  function logout()
  {
    axios.post('/logout').then(()=>{
      setWs(null);
      setId(null);
      setUsername(null);
    })
  }
  function sendFile(e)
  {
    const reader = new FileReader();
  const file = e.target.files[0];
  reader.readAsDataURL(file);
  reader.onload = () => {
    sendMessage(null, {
      name: file.name,
      data: reader.result,
    });
  };
  }
  const genAI = new GoogleGenerativeAI('your api key');
  async function run() {
    // The Gemini 1.5 models are versatile and work with both text-only and multimodal prompts
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
  
    const prompt = `"${newMessageText}"\n give me the rewritten  message in a good way one liner`
  
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    setNewMessageText(text)
    
  }
  
  

  useEffect(() => {
    const div = divUnderMessage.current;
    if (div) {
      div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get('/messages/' + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  useEffect(() => {
    axios.get('/people').then((res) => {
      const offlinePeopleArr = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArr.forEach((p) => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  const excludeSelf = { ...onlinePeople };
  delete excludeSelf[id];
  const messageWithoutDupes = uniqBy(messages, '_id');

  return (
    <div className='flex h-screen'>
      <div className='bg-white w-1/3 flex flex-col'>
        <div className='flex-grow'>
        <Logo />
        {Object.keys(excludeSelf).map((userId) => (
          <Contact
            key={userId}
            id={userId}
            onClick={() => {
              setSelectedUserId(userId);
            }}
            username={excludeSelf[userId]}
            selected={userId === selectedUserId}
            online={true}
          />
        ))}
        {Object.keys(offlinePeople).map((userId) => (
          <Contact
            key={userId}
            id={userId}
            onClick={() => {
              setSelectedUserId(userId);
            }}
            username={offlinePeople[userId].username}
            selected={userId === selectedUserId}
            online={false}
          />
        ))}
        </div>
        
        <div className='p-2 text-center flex items-center justify-center'>
        <span className='mr-2 text-sm text-gray-600 flex items-center'>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 text-blue-500">
        <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
        </svg>
 
          {username}
          </span>
          <button onClick={logout} className='text-sm bg-red-600 text-white py-1 px-2 border rounded-sm'>Logout</button>
          </div>
      </div>
      <div className='flex flex-col bg-green-50 w-2/3 p-2'>
        <div className='flex-grow overflow-y-scroll'>
          {!selectedUserId && (
            <div className='flex items-center justify-center h-full'>
              <div className='text-gray-400 text-3xl'>&larr; Select a person</div>
            </div>
          )}
          {selectedUserId &&
            messageWithoutDupes.map((message, index) => (
              <div
                key={index}
                className={message.sender === id ? 'text-right' : 'text-left'}
              >
                <div
                  key={index}
                  className={
                    'message-content text-left inline-block p-2 my-2 rounded-md text-sm ' +
                    (id === message.sender
                      ? 'bg-mgreen text-white font-semibold'
                      : 'bg-white text-gray-500')
                  }
                  dangerouslySetInnerHTML={{ __html: message.text }}

                ></div>
                
                <div ref={divUnderMessage}></div>
              </div>
            ))}
        </div>
        {selectedUserId && (
          <form className='flex gap-2 mx-2' onSubmit={sendMessage}>
           <label type='submit' className='bg-gray-200 rounded-md text-gray-600 cursor-pointer p-2'>
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
            </svg>
            <input type="file" className='hidden' onChange={sendFile} />
            </label>
            <input
              value={newMessageText}
              onChange={(ev) => {
                setNewMessageText(ev.target.value);
              }}
              type='text'
              className='bg-white border p-2 flex-grow rounded-md'
              placeholder='Type your message here'
            />
             <button onClick={run} type='button' className='bg-gray-200 rounded-md text-gray-600 cursor-pointer p-2'>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
             <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>

           
            </button>
            <button type='submit' className='bg-mygreen rounded-md text-white p-2'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='1.5'
                stroke='currentColor'
                className='w-6 h-6'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5'
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Chat;
