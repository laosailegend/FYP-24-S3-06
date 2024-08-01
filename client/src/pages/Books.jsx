import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Books = () => {
    const [books, setBooks] = useState([])

    useEffect(()=> {
        const fetchAllBooks = async() => {
            try {
                const res = await axios.get("http://localhost:8800/books")
                setBooks(res.data);
                // console.log(res);
            } catch (e) {
                console.log(e);
            }
        }
        fetchAllBooks();
    }, []);

    const handleDelete = async(id) => {
        try {
            await axios.delete(`http://localhost:8800/books/${id}`);
            window.location.reload();
        } catch (error) {
            console.log(error);
        }
    }
    return (
        <div>
            <h1>book shop</h1>
            <div className="books">
                {books.map(book => (
                    <div className="book" key={book.id}>
                        {book.cover && <img src={book.cover} alt="" />}
                        <h2>{book.title}</h2>
                        <p>{book.desc}</p>
                        <span>{book.price}</span>
                        <button className="delete" onClick={()=> handleDelete(book.id)}>delete</button>
                        <button className="update"><Link to={`/update/${book.id}`}>update</Link></button>
                    </div>
                ))}
            </div>
            <button><Link to="/add">add new book</Link></button>
        </div>
    )
}

export default Books;