"use client"

// -----------------------------
// IMPORTS
// -----------------------------
import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'


export default function Submit() {

  // -----------------------------
  // FORM STATE
  // -----------------------------
  // Stores user input before submission
  const [form, setForm] = useState({
    parameter_id: '',
    tissue_id: '',
    method_type: '',
    measurement_context: '',
    units: '',
    mean: '',
    sd: '',
    n: ''
  })


  // -----------------------------
  // INPUT HANDLER
  // -----------------------------
  // Updates form values dynamically
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }


  // -----------------------------
  // SUBMISSION HANDLER
  // -----------------------------
  // Sends data to Supabase (aggregation table)
  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('measurement_agg')
      .insert([
        {
          observation_id: 1, // placeholder for now
          mean: Number(form.mean),
          sd: Number(form.sd),
          n: Number(form.n)
        }
      ])

    if (error) {
      console.error(error)
      alert('Error submitting data')
    } else {
      alert('Data submitted')
    }
  }


  // -----------------------------
  // UI RENDER
  // -----------------------------
  return (
    <main style={{ padding: '20px' }}>

      {/* -----------------------------
          HEADER / NAVIGATION
      ----------------------------- */}
      <h1>Submit Data</h1>

      <nav>
        <Link href="/">Home</Link> |{" "}
        <Link href="/analytics">Analytics</Link>
      </nav>

      <hr />


      {/* -----------------------------
          DATA ENTRY FORM
      ----------------------------- */}
      <h2>Enter Summary Data</h2>

      <input name="mean" placeholder="Mean" onChange={handleChange} />
      <input name="sd" placeholder="SD" onChange={handleChange} />
      <input name="n" placeholder="Sample Size (n)" onChange={handleChange} />

      <button onClick={handleSubmit}>Submit</button>
    </main>
  )
}