import logo from './logo.svg';
import './App.css';

import
React
, {
    useEffect
  , useReducer
} from 'react';

import { API } from 'aws-amplify';

import {
      List
    , Input
    , Button}
  from 'antd';

import 'antd/dist/antd.css';

import { listNotes } from './graphql/queries';

import { v4 as uuid } from 'uuid';

import { createNote as CreateNote
        , deleteNote as DeleteNote
 } from './graphql/mutations';

const CLIENT_ID = uuid();


const initialState = {
  notes: []
  , loading: true
  , error: false
  , form: {
      name: ""
  ,   description: ""
}
};

const reducer = (state, action) => {
  switch(action.type) {
    case 'SET_NOTES':
    return {
      ...state
      , notes: action.notes
      , loading: false
    };
    break;

    case 'ERROR':
    return{
      ...state
      , loading: true
      , error: true
    };
    break;

    case 'ADD_NOTE':
      return { ...state
        , notes: [

        ...state.notes
        , action.note
        ]
      };


    case 'RESET_FORM':
      return {
        ...state
        , form: initialState.form
      };


    case 'SET_INPUT':
      return {
        ...state
        , form: {
          ...state.form
          , [action.name]: action.value
         }
       };


    default:
    return {
      ...state
    };

  }
};

const App = () => {

const [state, dispatch] = useReducer(reducer, initialState);

const fetchNotes = async () => {
  try {
    const notesData = await API.graphql({
      query: listNotes
    });

    dispatch({ type: 'SET_NOTES', notes: notesData.data.listNotes.items.sort((a, b) => a.name >= b.name ? 1 : -1 )
   })
  }
  catch (err) {
    console.error(err)
    dispatch({ type: 'ERROR' });
  }

};

useEffect(
  () => {
    fetchNotes();
  }
  , []
);

const styles = {
  container: {padding: 20},

  input: {marginBottom: 10},

  item: { textAlign: 'left' },

  p: { color: '#1890ff' }
}


const createNote = async () => {
  //Destructuring
const { form } = state;

//Lame form validation but good enough
if (!form.name || !form.description) {
   return alert('please enter a name and description');
}


const note = {
    ...form
    , clientId: CLIENT_ID
    , completed: false
    , id: uuid()
  };


//optimistic dispatch, updates local app state before calling GraphQl endpoint
dispatch({
  type: 'ADD_NOTE'

  //shorthand syntax for note: no
  , note
});


dispatch({
  type: 'RESET_FORM'
});


  try {
  await API.graphql({
      query: CreateNote
      ,variables: {
        input: note
       }
    });

    console.log('successfully created note!')
  } catch (err) {
    console.log("error: ", err);
  }
};

const onChange = (e)  => {
  dispatch({
    type: 'SET_INPUT'
    , name: e.target.name
    , value: e.target.value
  });
};


const deleteNote = async (noteToDelete) => {

  // optimisticly update state with the note removed.
dispatch({
  type: "SET_NOTES"
  , notes: state.notes.filter(x => x != noteToDelete)

});

  //call the backend to delete the // NOTE:

try {
  await API.graphql({
    query: DeleteNote
    , variables: {
      input: {
        id: noteToDelete.id
      }
    }
  });
}

catch (err){
  console.error(err);
}
};


const renderItem = (item) => {
  return (
    <List.Item style={styles.item}
    actions={[
    <p style={styles.p}
    onClick={() => deleteNote(item)}
    >
    Delete
    </p>
  ]}
    >
      <List.Item.Meta
        title={item.name}
        description={item.description}
      />
    </List.Item>
  );
}

  return (
    <div style={styles.container}>

  <Input
    onChange={onChange}
    value={state.form.name}
    placeholder="Enter Note Name"
    name='name'
    style={styles.input}
  />
  <Input
    onChange={onChange}
    value={state.form.description}
    placeholder="Enter description"
    name='description'
    style={styles.input}
  />
  <Button
    onClick={createNote}
    type="primary"
    >
    Create Note
    </Button>


   <List
     loading={state.loading}
     dataSource={state.notes}
     renderItem={renderItem}
   />
 </div>
  );

};

export default App;
