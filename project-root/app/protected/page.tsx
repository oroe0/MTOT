'use client'

import { useEffect, useState } from 'react';
import axios from 'axios';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { useRouter } from 'next/navigation';

// import { deleteConversations } from '@/app/api/conversation_empty/route';

export default function Protected() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // NEW: conversation slots
  const [conversations, setConversations] = useState([]);
  const [activeSlot, setActiveSlot] = useState(null);

  const [myCase, setMyCase] = useState({})
  const [witnesses, setWitnesses] = useState([])
  const [evidence, setEvidence] = useState([])
  const [caseTitle, setCaseTitle] = useState('')
  const [caseDescription, setCaseDescription] = useState('')
  const [caseRole, setCaseRole] = useState('')
  const [caseSide, setCaseSide] = useState('')
  const [personOfInterest, setPersonOfInterest] = useState(6)

  const [caseIsOpen, setCaseIsOpen] = useState(true);

  const [clickCount, setClickCount] = useState(0);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push('/login');
      else setUser(currentUser);
    });
    return () => unsubscribe();
  }, [router]);

  // Load slots when user changes
  useEffect(() => {
    if (!user) return;
    fetchSlots();
  }, [user]);

  // Load messages when slot changes
  useEffect(() => {
    if (!user || !activeSlot) return;
    fetchMessages();
  }, [user, activeSlot]);

  const fetchMessages = async () => {
    const res = await axios.get('/api/conversation_get', { params: { uid: user.uid, slotId: activeSlot } });
    setMessages(res.data?.messages ?? []);
    setWitnesses(JSON.parse(res.data.witnesses));
    setEvidence(JSON.parse(res.data.evidence));
    setCaseTitle(res.data.title);
    setCaseDescription(res.data.description);
    setCaseRole(res.data.role);
    setCaseSide(res.data.side);
    setPersonOfInterest(res.data.personOfInterest);
    setCaseIsOpen(res.data.isOpen);
    setClickCount(0);
  };

  const fetchSlots = async () => {
    const res = await axios.get('/api/conversation_list', { params: { uid: user.uid } });
    setConversations(res.data);
    if (res.data.length > 0) setActiveSlot(res.data[0].slotId);
  };

  const newConversation = async (Role) => {
    const Side = Math.random() > 0.5 ? 'prosecution' : 'defense'
    const res = await axios.post('/api/conversation_new', { uid: user.uid, role: Role, side: Side });
    setConversations((prev) => [res.data, ...prev]);
    setActiveSlot(res.data.slotId);
    setMessages([]);
    setCaseRole(Role);
    setCaseSide(Side);
    generateCase(res.data.slotId);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const sendQuery = async (e) => {
    e.preventDefault();
    if (!query.trim() || !user || !activeSlot) return;

    console.log('\t\thello, testing')

    const userMessage = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await axios.post('/api/groq', { message: query });
      const botMessage = { sender: 'bot', text: res.data.reply };

      await axios.post('/api/conversation_post', {
        uid: user.uid,
        slotId: activeSlot,
        userMessage: query,
        botMessage: res.data.reply,
        isOpen: true,
      });

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '❌ Error fetching/saving conversation.' },
      ]);
    } finally {
      setLoading(false);
      setQuery('');
    }
  };

  

  const handleQueries = async () => {
    //if (!caseIsOpen) {return}
    //setClickCount((prev) => prev++);
    /*

    const questionWitness = async () => {
      //e.preventDefault();
      if (!query.trim() || !user || !activeSlot) return;

      console.log('\t\thello, testing')

      const userMessage = { sender: 'user', text: query };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const compiledEvidence = 
            evidence[0][0]+' - '+evidence[0][1]+', '+
            evidence[1][0]+' - '+evidence[1][1]+', '+
            evidence[2][0]+' - '+evidence[2][1]+', '+
            evidence[3][0]+' - '+evidence[3][1]+'.'

        const res = await axios.post('/api/groq_witness', { 
          message: query,
          name: witnesses[personOfInterest][0],
          title: witnesses[personOfInterest][1],
          caseName: caseTitle, 
          description: caseDescription, 
          statement: witnesses[personOfInterest][2], 
          evidence: compiledEvidence,
        });
        const botMessage = { sender: 'bot', text: res.data.reply };

        await axios.post('/api/conversation_post', {
          uid: user.uid,
          slotId: activeSlot,
          userMessage: query,
          botMessage: res.data.reply,
          isOpen: true,
        });

        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'Error fetching/saving conversation.' },
        ]);
      } finally {
        setLoading(false);
        setQuery('');
      }
    };

    const defenseOpeningStatement = async () => {
      if (!query.trim() || !user || !activeSlot) return;

      const userMessage = { sender: 'user', text: query };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const compiledWitnesses = 
          witnesses[0][0]+' '+witnesses[0][1]+', said '+witnesses[0][2]+', '+
          witnesses[1][0]+' '+witnesses[1][1]+', said '+witnesses[1][2]+', '+
          witnesses[2][0]+' '+witnesses[2][1]+', said '+witnesses[2][2]+'. '
        const res = await axios.post('/api/groq_statements', { message: query, witnesses: compiledWitnesses });
        const botMessage = { sender: 'bot', text: res.data.reply };

        await axios.post('/api/conversation_post', {
          uid: user.uid,
          slotId: activeSlot,
          userMessage: query,
          botMessage: res.data.reply,
          isOpen: false,
        });

        setCaseIsOpen(false);

        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: '❌ Error fetching/saving conversation.' },
        ]);
      } finally {
        setLoading(false);
        setQuery('');
      }
    }

    const prosecutionOpeningStatement = async () => {
      if (!user || !activeSlot) return;

      setLoading(true);

      try {
        const compiledWitnesses = 
          witnesses[3][0]+' '+witnesses[3][1]+', said '+witnesses[3][2]+', '+
          witnesses[4][0]+' '+witnesses[4][1]+', said '+witnesses[4][2]+', '+
          witnesses[5][0]+' '+witnesses[5][1]+', said '+witnesses[5][2]+'. '
        const res = await axios.post('/api/groq_statements', { message: 'Create an opening statement for the prosecution', witnesses: compiledWitnesses });
        const botMessage = { sender: 'bot', text: res.data.reply };

        await axios.post('/api/conversation_post', {
          uid: user.uid,
          slotId: activeSlot,
          userMessage: query,
          botMessage: res.data.reply,
          isOpen: true,
        });

        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: '❌ Error fetching/saving conversation.' },
        ]);
      } finally {
        setLoading(false);
        setQuery('');
      }
    }

    const judgerOfStatements = async () => {
      //e.preventDefault();
      if (!query.trim() || !user || !activeSlot) return;

      console.log('\t\thello, testing')

      const userMessage = { sender: 'user', text: query };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const compiledMessages = messages.map((m) => (
          m.text+' '
        ))

        const res = await axios.post('/api/groq_judge', { 
          message: compiledMessages, side: caseSide,
        });
        const botMessage = { sender: 'bot', text: res.data.reply };

        await axios.post('/api/conversation_post', {
          uid: user.uid,
          slotId: activeSlot,
          userMessage: query,
          botMessage: res.data.reply,
          isOpen: true,
        });

        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'Error fetching/saving conversation.' },
        ]);
      } finally {
        setLoading(false);
        setQuery('');
      }
    }

    /*if (caseRole === 'statements') {
      if (caseSide === 'prosecution') {//* pros opening statements*
        defenseOpeningStatement();
        if (clickCount === 2) {
          judgerOfStatements()
        }
      }
      else {//** first bot open statements, then defense open statements *
        if (clickCount === 1) {
          prosecutionOpeningStatement();
        }
        else if (clickCount === 2) {
          judgerOfStatements()
        }
      }

    }*/
  };

  const generateCase = async (slotID) => {
    // e.preventDefault();
    if (!user || !activeSlot) return;

    setLoading(true);

    try {
      const res = await axios.post('/api/groq_cases', { message: 'Make a new case.' });
      

      const splitResponse = res.data.reply.split('@') 

      const witnessArray = splitResponse[1]
      const evidenceArray = splitResponse[2]
      const otherStuff = JSON.parse(splitResponse[3])

      const randomValue = Math.random();

      const specialGuy = Math.trunc(randomValue*6);

      setWitnesses(JSON.parse(witnessArray))
      setEvidence(JSON.parse(evidenceArray))
      setCaseTitle(otherStuff[0]+' vs. '+otherStuff[1]);
      setCaseDescription(otherStuff[2]);
      setPersonOfInterest(specialGuy);

      const responso = await axios.post('/api/case_generate', {
        uid: user.uid,
        slotId: slotID,
        witnesses: witnessArray,
        evidence: evidenceArray,
        description: otherStuff[2],
        title: otherStuff[0]+' vs. '+otherStuff[1],
        personOfInterest: specialGuy,
      });

    } catch (error) {
      console.log('\t\tBot Messaging Error.');
    } finally {
      fetchSlots();
      setLoading(false);
      setQuery('');
    }
  };

  const clearConversations = async () => {
    setConversations([]);
    newConversation('whole');
    const res = await axios.post('/api/conversation_empty', { uid: user.uid });
  }


  function Witness({ name, title, statement }) {
    return (
      <div className='m-2'>
        <h3 className='text-1xl font-bold'>{name} - {title}</h3>
        <p>{statement}</p>
      </div>
    )

  }

  function Evidence({ name, description }) {
    return (
      <div>
        <h3 className='font-bold'>{name}</h3>
        <p>{description}</p>
      </div>
    )
  }

  function DropdownButton() {
    const [open, setOpen] = useState(false)

    // Example functions
    const handleOption1 = () => {
      console.log("Run newConversation() as Witness")
      newConversation('witness')
    }

    const handleOption2 = () => {
      console.log("Run newConversation() as Cross")
      newConversation('cross')
    }

    const handleOption3 = () => {
      console.log("Run newConversation() as Direct")
      newConversation('direct')
    }

     const handleOption4 = () => {
      console.log("Run newConversation() as Opening/Closing")
      newConversation('statements')
    }

     const handleOption5 = () => {
      console.log("Run newConversation() as Entire Case Lawyer")
      newConversation('whole')
    }

    return (
      <div className="relative inline-block text-left">
        {/* Main Button */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="px-2 py-2 mx-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition"
        >
          New Case
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute mt-2 w-45 bg-white border border-gray-200 rounded-lg shadow-lg">
            <p className='block w-full text-center pt-2 text-xl'>Role:</p>
            <button
              onClick={() => {
                handleOption1()
                setOpen(false)
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Witness
            </button>
            <button
              onClick={() => {
                handleOption2()
                setOpen(false)
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Cross
            </button>
            <button
              onClick={() => {
                handleOption3()
                setOpen(false)
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Direct
            </button>
            <button
              onClick={() => {
                handleOption4()
                setOpen(false)
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Opening / Closing
            </button>
            <button
              onClick={() => {
                handleOption5()
                setOpen(false)
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Whole Case
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-950 via-sky-900 to-cyan-900 flex flex-col font-petrona">

      {/** Top Bar */}
      <div className="flex justify-between items-center px-6 py-4 bg-white/90 shadow">
        {/* Logo */}
        <a href='/'>
          <img src="/large-logo.png" className="w-12 h-12 rounded-full justify-center" />
        </a>
        

        <div className='flex flex-row'>
          {user && <p className="mr-4 mt-2 text-center font-oldenburg"><strong>{user.email}</strong></p>}
          <button
            onClick={handleLogout}
            className="mb-4  bg-red-500 text-white py-2 px-4 rounded-full font-oldenburg hover:bg-red-400 transition"
          >
            Logout
          </button>

        </div>
      </div>

      {/** Main area of the page */}
      <div className='flex'>

        {/* Sidebar for slots */}
        <div className="w-64 min-h-screen bg-slate-200/50 border p-4 flex flex-col items-center">
          {/** buttons */}
          <div className='m-3'>
            {/*<button
              onClick={newConversation}
              className="mb-4 mx-1 bg-blue-500 text-white py-2 px-2 rounded hover:bg-blue-600"
            >
              New Case
            </button>*/}
            <DropdownButton />
            <button
              onClick={clearConversations}
              className="mb-4 mx-2 bg-blue-500 text-white py-2 px-2 rounded-lg hover:bg-blue-400 transition"
            >
              Clear All
            </button>
          </div>
          {conversations.map((c) => (
            <div
              key={c._id.toString()} // ✅ always unique from MongoDB
              onClick={() => setActiveSlot(c.slotId)}
              className={`p-2 w-full rounded cursor-pointer mb-2 ${
                activeSlot === c.slotId ? 'bg-blue-400' : 'bg-slate-400'
              }`}
            >
              {c.title || `Conversation ${c.slotId}`}
            </div>
          ))}
        </div>

        {/* Main chat area */}
        <div className="flex-1 p-6 flex flex-row justify-center">

          {/** The case Files */}
          {activeSlot ? 
          <div className='flex flex-col mr-5 max-w-2xl'>
              
            <h1 className='text-bold text-white text-4xl mt-9 m-5 text-center font-oldenburg'>Case Files</h1>
                  
            {/** Witnesses */}
            <div className='flex flew-row'>

              {/** Prosecuter Witnesses */}
              <div className='flex flex-col w-1/2 mt-4 mr-1 bg-lime-100 p-3 rounded'>
                <h2 className='text-2xl'>Prosecution Witnesses:</h2>
                <ol>
                  <li><Witness name={witnesses?.[0]?.[0] ?? ''} title={witnesses?.[0]?.[1] ?? ''} statement={witnesses?.[0]?.[2] ?? ''} /></li>
                  <li><Witness name={witnesses?.[1]?.[0] ?? ''} title={witnesses?.[1]?.[1] ?? ''} statement={witnesses?.[1]?.[2] ?? ''} /></li>
                  <li><Witness name={witnesses?.[2]?.[0] ?? ''} title={witnesses?.[2]?.[1] ?? ''} statement={witnesses?.[2]?.[2] ?? ''} /></li>
                </ol>
              </div>

              {/** Defense Witnesses */}
              <div className='flex flex-col w-1/2 mt-4 ml-1 bg-indigo-100 p-3 rounded'>
                <h2 className='text-2xl'>Defense Witnesses:</h2>
                <ol>
                  <li><Witness name={witnesses?.[3]?.[0] ?? ''} title={witnesses?.[3]?.[1] ?? ''} statement={witnesses?.[3]?.[2] ?? ''} /></li>
                  <li><Witness name={witnesses?.[4]?.[0] ?? ''} title={witnesses?.[4]?.[1] ?? ''} statement={witnesses?.[4]?.[2] ?? ''} /></li>
                  <li><Witness name={witnesses?.[5]?.[0] ?? ''} title={witnesses?.[5]?.[1] ?? ''} statement={witnesses?.[5]?.[2] ?? ''} /></li>
                </ol>
              </div>

            </div>

            {/** Evidence */}
            <div className='m-5 p-4 pt-3 rounded bg-amber-100'>
              <h2 className='text-2xl'>Evidence:</h2>
              <Evidence name={evidence?.[0]?.[0] ?? ''} description={evidence?.[0]?.[1] ?? ''}/>
              <Evidence name={evidence?.[1]?.[0] ?? ''} description={evidence?.[1]?.[1] ?? ''}/>
              <Evidence name={evidence?.[2]?.[0] ?? ''} description={evidence?.[2]?.[1] ?? ''}/>
              <Evidence name={evidence?.[3]?.[0] ?? ''} description={evidence?.[3]?.[1] ?? ''}/>
            </div>

          </div>
          : <p></p>}
          


          <div className="max-w-2xl w-full bg-white rounded shadow p-6 mb-4">
            <h1 className="text-xl font-bold mb-2 text-center">{caseTitle}</h1>
            <p>{caseDescription}</p>
            {caseRole &&
              <p className='text-center m-9 text-xl'>You are  <>
                {caseRole === 'cross' && 'Cross Examining '+witnesses[personOfInterest][0]}
                {caseRole === 'direct' && 'Direct Examining '+witnesses[personOfInterest][0]}
                {caseRole === 'witness' && 'Playing the Role of '+witnesses[personOfInterest][0]}
                {caseRole === 'statements' && 'the Opening and Closing Statement Lawyer for the '+caseSide}
                {caseRole === 'whole' && 'the Lawyer for the Whole Case'}
                </>
              </p>
            }

            {/* Messages */}
            {activeSlot ? 
              <div>
                <div className="mb-4 max-h-64 overflow-y-auto border p-4 rounded bg-gray-100">
                    {messages.length === 0 && <p className="text-center text-gray-500">Start chatting...</p>}
                    {messages.map((msg, i) => (
                      <pre
                        key={i}
                        className={`whitespace-pre-wrap mb-2 p-2 rounded ${
                          msg.sender === 'user' ? 'bg-blue-200 text-blue-900' : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <strong>{msg.sender === 'user' ? 'You' : 'GROQ Bot'}:</strong> {msg.text}
                      </pre>
                    ))}
                </div>

                {/* Input */}
                <form className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter GROQ query"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="flex-grow p-2 border rounded"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      Send
                    </button>
                </form>

                <p>{witnesses?.[personOfInterest]?.[0] ?? ''}</p>
                <p>{clickCount}</p>
                <p>{JSON.stringify(caseIsOpen)}</p>
              </div>
            : <p>Create a New Case to Begin</p>}
          </div>
        </div>

      </div>
    </div>
  );
}