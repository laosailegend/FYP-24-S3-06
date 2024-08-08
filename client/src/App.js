import React from 'react';
// import { useState } from 'react';
// import Axios from 'axios';

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from './pages/Home';
// import Books from './pages/Books';
import CreateUser from './pages/CreateUser';
import Add from './pages/Add';
import UpdateUser from './pages/UpdateUser';

function App() {
  return (
    <>
      <div className='App'>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* <Route path="/books" element={<Books/>}/> */}
            <Route path="/user" element={<CreateUser/>}/>
            <Route path="/add" element={<Add />} />
            <Route path="/update/:id" element={<UpdateUser />} />
          </Routes>
        </BrowserRouter>
      </div>
    </>
  );
}

export default App;
