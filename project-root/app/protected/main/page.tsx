'use client'

import { useEffect, useState } from 'react';
import axios from 'axios';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { set } from 'mongoose';

export default function Main() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // NEW: conversation slots
  const [conversations, setConversations] = useState<{ _id: string; slotId: number; title?: string }[]>([]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

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

  const [answeringObjection, setAnsweringObjection] = useState(false)

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push('/login');
      else setUser(currentUser);
    });
    return () => unsubscribe();
  }, [router]);


  useEffect(() => {
    if (!user) return;
    fetchSlots();
  }, [user]); // This uses fetchSlots, anytime the user changes

  useEffect(() => {
    if (!user || !activeSlot) return;
    fetchMessages();
  }, [user, activeSlot]); // This uses fetch messages anytime the slot (or user) changes

  const fetchMessages = async () => {
    if (!user) return
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
    setFeedback('');
    setAnsweringObjection(false);
  }; // Sets all of the variables to the correct thing associated with this case.

  const fetchSlots = async () => {
    if (!user) return
    const res = await axios.get('/api/conversation_list', { params: { uid: user.uid } });
    setConversations(res.data);
    if (res.data.length > 0) setActiveSlot(res.data[0].slotId);
  }; // Gets all of the conversations of this user, than sets the conversation var to a list of all these convos.



  const newConversation = async (Role: string) => {
    if (!user) return

    const prosecutionOpeningStatement = async (betterWitnesses: string[][], slotID: number) => {
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
          { sender: 'bot', text: 'Error fetching/saving conversation.' },
        ]);
      } finally {
        setLoading(false);
        setQuery('');
      }
    } // Helper function. Sends the pros opening statement if needed

    const witnessBeingExaminedStarter = async (slotID: number, betterEvidence: string[][], POI: string[], title: string, description: string) => {
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
          { sender: 'bot', text: '❌ Error generating AI question.' },
        ])
      } finally {
        setLoading(false)
        setQuery('')
      }
    } // Helper function. Sends the first AI cross examination question. Trust, this is a much better way to do it than before.

    const generateCase = async (slotID: number, returnValues: boolean) => {
      // e.preventDefault();
      if (!user || !slotID) return;
  
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
    }; // Helper function. Actually creates the case info.

    const Side = Math.random() > 0.5 ? 'prosecution' : 'defense'
    const res = await axios.post('/api/conversation_new', { uid: user.uid, role: Role, side: Side });
    setConversations((prev) => [res.data, ...prev]);
    setActiveSlot(res.data.slotId);
    setMessages([]);
    setCaseRole(Role);
    setCaseSide(Side);
    if ((Role === 'witness') || (Role === 'statements' && Side === 'defense')) {

      const result = await generateCase(res.data.slotId, true);
      if (!result) return
      const {betterEvidence, betterWitnesses, POI, title, description} = result
      if (Role === 'witness') {
        witnessBeingExaminedStarter(res.data.slotId, betterEvidence, POI, title, description)
      }
      else {
        prosecutionOpeningStatement(betterWitnesses, res.data.slotId);
      }
    }
    else {
      await generateCase(res.data.slotId, false);
    }
  }; // This begins a new case with the given role.


  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const sendQuery = async (e: React.FormEvent<HTMLFormElement>) => {
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
  }; // Deprecated function to send a query. Can be used as a base function based on a button inside a form element.

  

  const handleQueries = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!caseIsOpen || !user) {return}
    setLoading(true);
    

    const questionWitness = async (isForced: boolean) => {
      //e.preventDefault();
      if (!query.trim() || !user || !activeSlot) return;
      
      let userMessage = { sender: '', text: ''};
      if (isForced) {
        userMessage = { sender: 'user', text: messages[messages.length-2].text };
      }
      else {
        userMessage = { sender: 'user', text: query };
      }

      
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);


      const objection = await findObjection()
      if (objection === '' || objection === "Error with objections." || isForced){
        setClickCount(clickCount + 1);
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

          let res = { data: { reply: '' } };
          if (!isForced) {
            res = await axios.post('/api/groq_witness', { 
              message: query,
              name: witnesses[personOfInterest][0],
              title: witnesses[personOfInterest][1],
              caseName: caseTitle, 
              description: caseDescription, 
              statement: witnesses[personOfInterest][2], 
              evidence: compiledEvidence,
              messages: compiledMessages,
            });
          }
          else {
            res = await axios.post('/api/groq_witness', { 
              message: messages[messages.length-2].text,
              name: witnesses[personOfInterest][0],
              title: witnesses[personOfInterest][1],
              caseName: caseTitle, 
              description: caseDescription, 
              statement: witnesses[personOfInterest][2], 
              evidence: compiledEvidence,
              messages: compiledMessages,
            });
          }
  
          
          const botMessage = { sender: 'bot', text: res.data.reply };
          
          if (!isForced) {
            await axios.post('/api/conversation_post', {
              uid: user.uid,
              slotId: activeSlot,
              userMessage: query,
              botMessage: res.data.reply,
              isOpen: true,
              clickCount: clickCount,
            });
          }
          else {
            await axios.post('/api/conversation_post', {
              uid: user.uid,
              slotId: activeSlot,
              userMessage: messages[messages.length-2].text,
              botMessage: res.data.reply,
              isOpen: true,
              clickCount: clickCount,
            });
          }
  
          setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            { sender: 'bot', text: 'Error fetching/saving conversation.' },
          ]);
        } finally {}
      } else {
        try {
          if (!objection) return;
          setAnsweringObjection(true)

          const botMessage = { sender: 'objection', text: objection };

          setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
          setMessages((prev) => [...prev, { sender: 'objection', text: 'Error, bad question' }]);
        } finally {}
      }
    };

    const answerJudge = async () => {
      if (!query.trim() || !user || !activeSlot) return;

      setLoading(true)
      
      const objectedQuestion = { sender: 'user', text: messages[messages.length-2].text }
      const objection = { sender: 'objection', text: messages[messages.length-1].text }
      const userMessage = { sender: 'user', text: query };
      let overruled = false;
      

      
      try {
        const res = await axios.post('/api/groq_inspector', {
          message: messages[messages.length-2].text + messages[messages.length-1].text + query,
          role: caseRole,
        })
        alert(res.data.reply)

        
        
        let judgeMessage = { sender: 'judge', text: '' }

        if (res.data.reply === 'Sustained.') {
          judgeMessage.text = 'Sustained. Ask a different question.'
        }
        else if (res.data.reply === 'Overruled.') {
          judgeMessage.text = 'Overrulled.' 
          overruled = true;
        }
        
        
        await axios.post('/api/conversation_objection', {
          uid: user.uid,
          slotId: activeSlot,
          userMessage: messages[messages.length-2].text,
          botMessage: messages[messages.length-1].text,
          response: query,
          judgeMessage:  judgeMessage.text,
        })
        setMessages((prev) => [...prev, userMessage, judgeMessage]);

      } catch (error) {
        setMessages((prev) => [...prev, userMessage, { sender: 'judge', text: 'Error judging statement' }]);
      } finally {
        if (overruled) {await questionWitness(true);}

        setAnsweringObjection(false)
        setLoading(false)
        setQuery('')
      }
    } // Helper function. Allows the user to respond to an objection instead of having no choice.

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
    
    // Not essentially useless anymore. Not super helpful though.
    const examination = async () => {
      if (!answeringObjection) {
        await questionWitness(false)
      }
      else {
        await answerJudge()
      }
    }


    const findObjection = async () => {
      if (!user || !activeSlot) return;

      let reply = '';

      try {
        const res = await axios.post('/api/groq_objecter', { 
          message: query,
          title: witnesses[personOfInterest][1], 
          description: caseDescription, 
          statement: witnesses[personOfInterest][2], 
          role: caseRole,
        });

        if (res.data.reply !== "No Objection.") {
          reply = res.data.reply;
        }
        

      } catch (error) {
        return "Error with objections."
      } finally {
        return reply
      }
    } // Helper function. Sends the message to Groq Objector and returns objections

    

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

    if (clickCount > 6)
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

    setLoading(false);
  };  // The Main function that runs most of this platform. Handles what happens when you send a message.

  const judgerOfStatements = async () => {

    //e.preventDefault();
    if (!user || !activeSlot) return;
    //alert('clicked');


    setLoading(true);

    try {
      const compiledMessages = messages.map(m => m.text).join(' ')

      const res = await axios.post('/api/groq_judge', { 
        message: compiledMessages, side: caseSide, role: caseRole,
      });

      setFeedback(res.data.reply)
      
    } catch (error) {
      setFeedback('Error fetching judge.');
    } finally {
      setLoading(false);
    }
  } // Button function. This is the function that provides feedback. It works almost like a standalone funtion, with the button below.


  const clearConversations = async () => {
    if (!user) return
    setConversations([]);

    setActiveSlot(null)
    setMessages([]);
    setWitnesses([]);
    setEvidence([]);
    setCaseTitle('');
    setCaseDescription('');
    setCaseRole('');
    setCaseSide('');
    setPersonOfInterest(0);
    setCaseIsOpen(false);
    setClickCount(0);
    setFeedback('');

    const res = await axios.post('/api/conversation_empty', { uid: user.uid });
  } // Button function. Used to clear all convos and reset all variables.


  function Witness({ name, title, statement }: {
    name: string
    title: string
    statement: string
  }) {
    return (
      <div className='m-2'>
        <h3 className='text-1xl font-bold'>{name} - {title}</h3>
        <p>{statement}</p>
      </div>
    )

  } // Just makes witnesses easier

  function Evidence({ name, description }: {
    name: string
    description: string
  }) {
    return (
      <div>
        <h3 className='font-bold'>{name}</h3>
        <p>{description}</p>
      </div>
    )
  } // Just makes evidence easier

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
              Opening
            </button>
            <button
              onClick={() => {
                handleOption5()
                setOpen(false)
              }}
              disabled={true}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
            >
              Whole Case
            </button>
          </div>
        )}
      </div>
    )
  } // Button that allows you to choose your role

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

        
        {/* The REAL Main area */}
        <div className="ml-64 p-6 flex flex-row justify-center items-start">

          {/** The case Files */}
          {activeSlot ? 
          <div className='flex flex-col items-center mr-5 w-150'>

            {/* Case is ... */}
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
          

          {/* The grey box on the side */}
          <div className="w-135 bg-zinc-200 rounded-3xl shadow-lg p-6 mb-4">

            {/* The top part, above messages */}
            <h1 className="text-xl font-bold mb-2 text-center">{caseTitle}</h1>
            <p>{caseDescription}</p>
            {caseRole &&
              <p className='text-center m-9 text-xl'>You are  <>
                {caseRole === 'cross' && 'cross examining '+(witnesses?.[personOfInterest]?.[0] ?? '')}
                {caseRole === 'direct' && 'direct examining '+(witnesses?.[personOfInterest]?.[0] ?? '')}
                {caseRole === 'witness' && ' '+(witnesses?.[personOfInterest]?.[0] ?? '')}
                {caseRole === 'statements' && 'the opening statement lawyer for the '+caseSide}
                {caseRole === 'whole' && 'the lawyer for the whole case'}
                </>.
              </p>
            }

            {/* Messages */}
            {activeSlot ? 
              <main className="flex-1 flex flex-col items-center">
                <div className="max-w-3xl w-full backdrop-blur rounded-2xl">

                  {/* Chat messages */}
                  <div className="mb-4 max-h-100 overflow-y-auto border rounded-lg p-4 bg-gray-100">
                    {messages.length === 0 && (
                      <p className="text-center text-gray-500 italic">The Trial Stenographer</p>
                    )}
                    {messages.map((msg, i) => (
                      <p
                        key={i}
                        className={`whitespace-pre-wrap mb-2 p-2 rounded-lg shadow-sm ${
                          msg.sender === 'user' ? 'bg-sky-100 text-zinc-900' :
                          (msg.sender === 'judge' ? 'bg-emerald-100 text-neutral-900' :
                            'bg-rose-100 text-slate-900')
                            
                        }`}
                      >
                        {msg.text && (
                          <>
                            <strong>
                              {msg.sender === 'user' ? 'You' : 
                              (msg.sender === 'judge' ? 'Judge' : 
                              (((caseRole!=='direct' && caseRole!=='cross') || msg.sender === 'objection') ? 'Adversary' : 
                              (witnesses?.[personOfInterest]?.[0] ?? '')))
                              }:
                            </strong>{' '}
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

            {/* The Judge Me button and feedback */}
            {activeSlot &&
            <div className='text-center mt-9'>
              <div className="p-10">
                {(!caseIsOpen && feedback === '') && 
                <button 
                  onClick={() => {setLoading(true); judgerOfStatements();}} 
                  disabled={loading}
                  className="bg-emerald-700 text-white py-2 px-4 rounded-xl hover:bg-emerald-600 transition disabled:opacity-50"
                >
                  JUDGE ME
                </button>
                }
                
                <p className='pt-0'>{feedback}</p>
              </div>
            </div>}

          </div>
        </div>

      </div>
    </div>
  );
}