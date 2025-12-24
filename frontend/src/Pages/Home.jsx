import React from 'react'
import { useEffect } from 'react'

function Home() {


    useEffect(()=>{
        const data = fetch("http://localhost:8000/auth/register",{
            method:"GET",
    })
    .then(res=>res.json())
    .then(data=> console.log(data.message))
    .catch(e=>console.log(e));
    
},[]);

  return (
    <div>hoee</div>
  )
}

export default Home;