'use client'

import { useEffect, useState } from 'react';
import axios from 'axios';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { set } from 'mongoose';

// import { deleteConversations } from '@/app/api/conversation_empty/route';

export default function Main() {
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

  const [feedback, setFeedback] = useState('')

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
    setClickCount(res.data.questions);
  };

  const fetchSlots = async () => {
    const res = await axios.get('/api/conversation_list', { params: { uid: user.uid } });
    setConversations(res.data);
    if (res.data.length > 0) setActiveSlot(res.data[0].slotId);
  };

  const newConversation = async (Role) => {
    const prosecutionOpeningStatement = async (betterWitnesses, slotID) => {
      if (!user) return;

      setLoading(true);

      try {
        const compiledWitnesses = 
          betterWitnesses[3][0]+' '+betterWitnesses[3][1]+', said '+betterWitnesses[3][2]+', '+
          betterWitnesses[4][0]+' '+betterWitnesses[4][1]+', said '+betterWitnesses[4][2]+', '+
          betterWitnesses[5][0]+' '+betterWitnesses[5][1]+', said '+betterWitnesses[5][2]+'. '
        const res = await axios.post('/api/groq_statements', { message: 'Create an opening statement for the prosecution', witnesses: compiledWitnesses });
        const botMessage = { sender: 'bot', text: res.data.reply };

        await axios.post('/api/conversation_post', {
          uid: user.uid,
          slotId: slotID,
          userMessage: '',
          botMessage: res.data.reply,
          isOpen: true,
          clickCount: clickCount,
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

    // 🔹 Witness role: AI asks questions, user responds
    const witnessBeingExaminedStarter = async (slotID, betterEvidence, POI, title, description) => {
      if (!user) return
      setLoading(true)

      try {
        const compiledEvidence = 
            betterEvidence[0][0]+' - '+betterEvidence[0][1]+', '+
            betterEvidence[1][0]+' - '+betterEvidence[1][1]+', '+
            betterEvidence[2][0]+' - '+betterEvidence[2][1]+', '+
            betterEvidence[3][0]+' - '+betterEvidence[3][1]+'.'
        
        const res = await axios.post('/api/groq_cross_lawyer', {
          message: '',
          name: POI[0],
          title: POI[1],
          caseName: title, 
          description: description, 
          statement: POI[2], 
          evidence: compiledEvidence,
          messages: ''
        })
        const botMessage = { sender: 'bot', text: res.data.reply }

        await axios.post('/api/conversation_post', {
          uid: user.uid,
          slotId: slotID,
          userMessage: '', // AI asked the question
          botMessage: res.data.reply,
          isOpen: true,
          clickCount: 0,
        })

        setMessages((prev) => [...prev, botMessage])
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: '❌ Error generating AI question. OOGA BOOGA' },
        ])
      } finally {
        setLoading(false)
        setQuery('')
      }
    }

    const Side = Math.random() > 0.5 ? 'prosecution' : 'defense'
    const res = await axios.post('/api/conversation_new', { uid: user.uid, role: Role, side: Side });
    setConversations((prev) => [res.data, ...prev]);
    setActiveSlot(res.data.slotId);
    setMessages([]);
    setCaseRole(Role);
    setCaseSide(Side);
    if ((Role === 'witness') || (Role === 'statements' && Side === 'defense')) {
      console.log("ooga booga")
      const {betterEvidence, betterWitnesses, POI, title, description} = await generateCase(res.data.slotId, true);
      if (Role === 'witness') {
        witnessBeingExaminedStarter(res.data.slotId, betterEvidence, POI, title, description)
      }
      else {
        prosecutionOpeningStatement(betterWitnesses, res.data.slotId);
      }
    }
    else {
      generateCase(res.data.slotId, false);
    }
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

  

  const handleQueries = async (e) => {
    e.preventDefault();
    if (!caseIsOpen) {return}
    setLoading(true);

    if (clickCount > 8)
    {
      setCaseIsOpen(false)
      const userMessage = { sender: 'user', text: query };
      setMessages((prev) => [...prev, userMessage]);
      if (caseRole === 'direct' || caseRole === 'cross') {
        const botMessage = { sender: 'user', text: 'Thank you your Honor, I have no further questions at this time. ' };

        await axios.post('/api/conversation_post', {
          uid: user.uid,
          slotId: activeSlot,
          userMessage: 'Thank you your Honor, I have no further questions at this time. ',
          botMessage: '',
          isOpen: false,
          clickCount: clickCount,
        });
        setMessages((prev) => [...prev, botMessage]);
      }
      else if (caseRole === 'witness') {
        const botMessage = { sender: 'bot', text: 'Thank you your Honor, I have no further questions at this time. ' };

        await axios.post('/api/conversation_post', {
          uid: user.uid,
          slotId: activeSlot,
          userMessage: query,
          botMessage: 'Thank you your Honor, I have no further questions at this time. ',
          isOpen: false,
          clickCount: clickCount,
        });
        setMessages((prev) => [...prev, botMessage]);
      }
      setLoading(false);
      setQuery('');
      return
    }
    

    const questionWitness = async () => {
      //e.preventDefault();
      if (!query.trim() || !user || !activeSlot) return;

      //console.log('\t\thello, testing')

      const userMessage = { sender: 'user', text: query };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        let compiledMessages = ""
        for (const message of messages) {
          compiledMessages += message.text + " "
        }

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
          messages: compiledMessages,
        });
        const botMessage = { sender: 'bot', text: res.data.reply };

        await axios.post('/api/conversation_post', {
          uid: user.uid,
          slotId: activeSlot,
          userMessage: query,
          botMessage: res.data.reply,
          isOpen: true,
          clickCount: clickCount,
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
      setClickCount(clickCount + 1);

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
          clickCount: clickCount,
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
    
    // essentially useless
    const examination = async () => {
      await questionWitness()
    }

    

    const witnessBeingExamined = async () => {
      if (!user || !activeSlot) return
      setLoading(true)
      setClickCount(clickCount + 1)
      const userMessage = { sender: 'user', text: query };
      setMessages((prev) => [...prev, userMessage]);

      try {
        let compiledMessages = ""
        for (const message of messages) {
          compiledMessages += message.text + " "
        }

        const compiledEvidence = 
            evidence[0][0]+' - '+evidence[0][1]+', '+
            evidence[1][0]+' - '+evidence[1][1]+', '+
            evidence[2][0]+' - '+evidence[2][1]+', '+
            evidence[3][0]+' - '+evidence[3][1]+'.'
        
        const res = await axios.post('/api/groq_cross_lawyer', {
          message: query,
          name: witnesses[personOfInterest][0],
          title: witnesses[personOfInterest][1],
          caseName: caseTitle, 
          description: caseDescription, 
          statement: witnesses[personOfInterest][2], 
          evidence: compiledEvidence,
          messages: compiledMessages,
        })
        const botMessage = { sender: 'bot', text: res.data.reply }

        await axios.post('/api/conversation_post', {
          uid: user.uid,
          slotId: activeSlot,
          userMessage: query,
          botMessage: res.data.reply,
          isOpen: true,
          clickCount: clickCount+1,
        })

        setMessages((prev) => [...prev,  botMessage])
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: '❌ Error generating AI question.' },
        ])
      } finally {
        setLoading(false)
        setQuery('')
      }
    }

    if (caseRole === 'statements') {
      if (caseSide === 'prosecution') {//* pros opening statements*/
        if (clickCount === 0) {
          await defenseOpeningStatement(); 
        }
      }
      else {//** first bot open statements, then defense open statements */
        if (clickCount === 0) {
          setLoading(true)
          await axios.post('/api/conversation_post', {
            uid: user.uid,
            slotId: activeSlot,
            userMessage: query,
            botMessage: '',
            isOpen: false,
            clickCount: 1,
          });
          setClickCount(1)
          
          setMessages((prev) => [...prev, { sender: 'user', text: query}])
          setQuery('')
          setCaseIsOpen(false);
          setLoading(false)
        }
      }

    } else if (caseRole === 'direct') {
      await examination()
    } else if (caseRole === 'cross') {
      await examination()
    } else if (caseRole === 'witness') {
      await witnessBeingExamined()
    }
    setLoading(false);
  };

  const judgerOfStatements = async () => {

    //e.preventDefault();
    if (!user || !activeSlot) return;


    setLoading(true);

    try {
      const compiledMessages = messages.map(m => m.text).join(' ')

      const res = await axios.post('/api/groq_judge', { 
        message: compiledMessages, side: caseSide,
      });

      setFeedback(res.data.reply)
      
    } catch (error) {
      setFeedback('Error fetching judge.');
    } finally {
      setLoading(false);
    }
  }


  const generateCase = async (slotID, returnValues) => {
    // e.preventDefault();
    if (!user || !activeSlot) return;

    let returning = null;

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
      returning = {
        betterWitnesses: JSON.parse(witnessArray),
        betterEvidence: JSON.parse(evidenceArray),
        POI: JSON.parse(witnessArray)[specialGuy],
        title: otherStuff[0]+' vs. '+otherStuff[1],
        description: otherStuff[2],
      }

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
      if (returnValues) {return returning;}
      
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
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-yellow-200 via-stone-400 to-blue-900 text-gray-900 font-petrona">

      {/* Fixed Top Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/80 shadow-md backdrop-blur">
        {/* Logo */}
        <a href="/protected" className="flex items-center space-x-2">
          <img src="/large-logo.png" className="w-12 h-12 rounded-full" />
          <span className="pl-3 font-bold font-oldenburg text-lg text-blue-900">Mock Trial Online Trainer</span>
        </a>

        <div className="flex items-center space-x-3">
          {user && <p className="text-blue-900 font-semibold">{user.email}</p>}
          <button
            onClick={async () => { await signOut(auth); router.push('/') }}
            className="px-4 py-2 bg-red-500 rounded-full text-white font-semibold hover:bg-red-400 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/** Main area of the page */}
      <div className="flex flex-1 pt-24">

        

        {/* Sidebar */}
        <aside className="fixed top-0 left-0 w-64 h-screen bg-zinc-200/80 border-r shadow-lg flex flex-col pt-24 p-4">
          <div className="space-y-3 mb-6">
            {/* Dropdown + Clear */}
            <DropdownButton />
            <button
              onClick={clearConversations}
              className="mb-4 mx-2 bg-blue-500 text-white py-2 px-2 rounded-lg hover:bg-blue-400 transition"
            >
              Clear All
            </button>
          </div>

          {/* Conversation Slots */}
          <div className="flex-1 w-full space-y-2 overflow-y-auto">
            {conversations.map((c) => (
              <div
                key={c._id.toString()}
                onClick={() => setActiveSlot(c.slotId)}
                className={`p-2 w-full rounded cursor-pointer transition ${
                  activeSlot === c.slotId
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-slate-300 hover:bg-slate-200'
                }`}
              >
                {c.title || `Conversation ${c.slotId}`}
              </div>
            ))}
          </div>
        </aside>

        
        {/* Main chat area */}
        <div className="ml-64 p-6 flex flex-row justify-center items-start">

          {/** The case Files */}
          {activeSlot ? 
          <div className='flex flex-col items-center mr-5 w-150'>
            <div className='flex flex-row'>
              <h1 className='text-bold text-blue-950 text-5xl mt-9 mx-6 text-center font-oldenburg'>Case is</h1>
              {caseIsOpen ? 
              <h1 className='text-bold text-emerald-800 text-5xl mt-9 text-center font-oldenburg'>Open!</h1> 
              : <h1 className='text-bold text-red-800 text-5xl mt-9 text-center font-oldenburg'>Closed.</h1>}
            </div>

            
             
            <h1 className='text-bold text-blue-950 text-4xl mt-9 m-5 text-center font-oldenburg'>Case Files</h1>
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
          


          <div className="w-135 bg-zinc-200 rounded-3xl shadow-lg p-6 mb-4">
            <h1 className="text-xl font-bold mb-2 text-center">{caseTitle}</h1>
            <p>{caseDescription}</p>
            {caseRole &&
              <p className='text-center m-9 text-xl'>You are  <>
                {caseRole === 'cross' && 'cross examining '+(witnesses?.[personOfInterest]?.[0] ?? '')}
                {caseRole === 'direct' && 'direct examining '+(witnesses?.[personOfInterest]?.[0] ?? '')}
                {caseRole === 'witness' && ' '+(witnesses?.[personOfInterest]?.[0] ?? '')}
                {caseRole === 'statements' && 'the opening and closing statement lawyer for the '+caseSide}
                {caseRole === 'whole' && 'the lawyer for the whole case'}
                </>.  {clickCount}
              </p>
            }

            {/* Messages */}
            {activeSlot ? 
              <main className="flex-1 flex flex-col items-center">
                <div className="max-w-3xl w-full backdrop-blur rounded-2xl">

                  {/* Chat messages */}
                  <div className="mb-4 max-h-130 overflow-y-auto border rounded-lg p-4 bg-gray-100">
                    {messages.length === 0 && (
                      <p className="text-center text-gray-500 italic">The Trial Stenographer</p>
                    )}
                    {messages.map((msg, i) => (
                      <p
                        key={i}
                        className={`whitespace-pre-wrap mb-2 p-2 rounded-lg shadow-sm ${
                          msg.sender === 'user'
                            ? 'bg-sky-100 text-zinc-900'
                            : 'bg-rose-100 text-slate-900'
                        }`}
                      >
                        {msg.text && (
                          <>
                            <strong>{msg.sender === 'user' ? 'You' : (caseRole!=='direct' ? 'Adversary' : (witnesses?.[personOfInterest]?.[0] ?? ''))}:</strong>{' '}
                            {msg.text}
                          </>
                        )}
                      </p>
                    ))}
                  </div>

                  {/* Input */}
                  <form onSubmit={handleQueries} className="flex space-x-2">
                    <textarea
                      placeholder="Begin Talking"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      rows={1}
                      className="flex-grow p-2 border rounded-lg shadow-sm bg-white focus:outline-none focus:ring focus:ring-blue-300 resize-none overflow-hidden"
                      disabled={loading || !caseIsOpen}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = "auto" // reset before recalculating
                        target.style.height = target.scrollHeight + "px"
                      }}
                    />
                    <button
                      type="submit"
                      disabled={loading || !caseIsOpen}
                      className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-500 transition disabled:opacity-50"
                    >
                      Send
                    </button>
                  </form>

                </div>
              </main>
            : <p>Create a New Case to Begin</p>}

            {activeSlot &&
            
            <div className='text-center mt-9'>
              <div className="p-10">
                <button 
                  onClick={() => {alert('clicked'); setLoading(true); judgerOfStatements();}} 
                  disabled={caseIsOpen || loading}
                  className="bg-emerald-700 text-white py-2 px-4 rounded-xl hover:bg-emerald-600 transition disabled:opacity-50"
                >
                  JUDGE ME
                </button>
                <p className='pt-8'>{feedback}</p>
              </div>
            </div>}
          </div>
        </div>

      </div>
    </div>
  );
}