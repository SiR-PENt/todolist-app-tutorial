import { useState, useEffect } from "react" //import useEffect
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, query, where, getDocs } from "firebase/firestore"; // import onSnapshot from firestore
import { useGlobalContext } from "./components/Context";
import { db } from "./components/firebaseConfig";

type Task = {
  title: string,
  completed: boolean,
  id:string,  
}[];       //define the task type

export default function App() {

  const { userId } = useGlobalContext()
  const [ title, setTitle ] = useState<string>('');
  const [ tasks, setTasks ] = useState<Task>([]);
  const [ completedTasksCount, setCompletedTasksCount ] = useState(0);
  const docRef = collection(db, `users/${userId}/tasks`);

  useEffect(() => {
    if(userId !== '') {
       // onSnapshot so I can get data update real-time
       const unsubscribe = onSnapshot(docRef, (querySnapshot) => {
              const tasks = querySnapshot.docs.map((doc) => {
              const data = doc.data();
               return {  //return data compatible with data types specified in the tasks variable 
                 title: data.title,
                 completed: data.completed,
                 id: doc.id,
            }
          }); 
             setTasks(tasks)              
       });
       return () => {
          unsubscribe();
       };
    }
    }, [userId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if(title !== '') {
        try {
            await addDoc(collection(db, 'users', userId, 'tasks'), {
                 title,
                 completed: false,
             })
            setTitle('')
            console.log('Task successfully added')
        }
        catch(e) {
            console.log('Unsuccessful')
        }
      }
  }

  const handleComplete = async (id: string, completed: boolean): Promise<void> => {
    await updateDoc(doc(db, `users/${userId}/tasks/${id}`), {
        completed: !completed
    })}

  const handleDelete = async (id: string): Promise<void> => {
      await deleteDoc(doc(db, `users/${userId}/tasks/${id}`));
   }

 const handleFilter = async (val: boolean): Promise<void> => {
    const q = query(docRef, where("completed", "==", val)) //get collection with respect to if completed is true or not
    const querySnapshot = await getDocs(q)
     const tasks = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {  //return data compatible with data types specified in the tasks variable 
            title: data.title,
            completed: data.completed,
            id: doc.id,
              }
           }); 
    // const tasks = mapQuerySnapshotToTasks(querySnapshot) //fetch the document in the collection
     setTasks(tasks);
          }

    const handleFetchAll = async (): Promise<void> => {    
        const querySnapshot = await getDocs(docRef);
        const tasks = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {  //return data compatible with data types specified in the tasks variable 
              title: data.title,
              completed: data.completed,
              id: doc.id,
                }
             }); 
        // const tasks = mapQuerySnapshotToTasks(querySnapshot)
            setTasks(tasks); 
          }

   const handleClearCompleted = async (): Promise<void> => {
     const q = await getDocs(query(docRef, where("completed", "==", true))); //get the document so we can loop through
       q.forEach( async (doc) => { //loop through
          await deleteDoc(doc.ref);
          })
      }

    useEffect(() => {
        const unsubscribe = onSnapshot(query(docRef, where('completed', '==', false)), (q) => {
          setCompletedTasksCount(q.docs.length);
        });
        return unsubscribe;
  }, [docRef]);

  return (
     <div style={{
       display: 'flex',
       justifyContent: "center",
       alignContent:"center",
     }}>

    <div style={{
      width:'300px' }}>

      <p>Todo List App</p>

      <form 
      onSubmit={handleSubmit}
      style={{
        marginTop: '5px'}}>
      <input 
      value={title} onChange={(e) => setTitle(e.target.value)}/>
      </form>
      <div style={{
        marginTop: '10px'}}>
        {   
          tasks.length > 0 && ( //since tasks may be undefined 
             tasks.map(task => {
             const { id, title, completed } = task;
             return (               
               <div id={id} style={{
                  display:'flex',
                  justifyContent: 'space-between',
                  marginTop: '10px'
               }}>
               <label style={{               
               }}>
               <input type="checkbox"
                 checked={completed}
                 onChange={() => handleComplete(id, completed)}
                  />          
                 {
                  completed ? 
                  <s className='completed'>{title}</s> 
                  : <span>{title}</span>
                }          
               </label>
               <button
                onClick={() => handleDelete(id)}>
                Delete</button>
               </div>
               )}))}
        </div>
      {/* footer */}

       <footer style={{
        marginTop: '10px'
        }}>  
         <div style={{
          display: 'flex',
          justifyContent:'space-between'
          }}>
          <button onClick={handleFetchAll}>All</button>  
          <button onClick={() => handleFilter(false) }>Active</button>  
          <button onClick={() => handleFilter(true)}>Completed</button>  
         </div>
         
         <div style={{
          display: 'flex',
          justifyContent:'space-between',
          marginTop: '10px'
          }}>
         <button>{completedTasksCount} items left</button>
         <button onClick={handleClearCompleted}>
          Clear Completed
          </button>  
          </div>
      </footer>

    </div>
     </div>
  )
}

