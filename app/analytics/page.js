"use client"

// -----------------------------
// IMPORTS
// -----------------------------
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'


export default function Analytics() {

  // -----------------------------
  // STATE MANAGEMENT
  // -----------------------------
  // Stores dataset fetched from database
  const [data, setData] = useState([])


  // -----------------------------
  // DATA FETCHING FUNCTION
  // -----------------------------
  // Retrieves full dataset for analysis view
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('observation')
      .select(`
        parameter(name),
        tissue(name),
        source(title),
        measurement_agg(mean, sd, min, max, n)
      `)

    if (error) {
      console.error(error)
      return
    }

    setData(data)
  }


  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  // Runs once when page loads
  useEffect(() => {
    fetchData()
  }, [])


  // -----------------------------
  // UI RENDER
  // -----------------------------
  return (
    <main style={{ padding: '20px' }}>

      {/* -----------------------------
          HEADER / NAVIGATION
      ----------------------------- */}
      <h1>Analytics</h1>

      <nav>
        <Link href="/">Home</Link> |{" "}
        <Link href="/submit">Submit</Link>
      </nav>

      <hr />


      {/* -----------------------------
          DATA DISPLAY
      ----------------------------- */}
      <h2>Dataset</h2>

      {data.map((item, i) => (
        <div key={i} style={{ marginBottom: '15px' }}>
          <h3>{item.parameter?.name}</h3>

          <p><strong>Tissue:</strong> {item.tissue?.name}</p>
          <p><strong>Study:</strong> {item.source?.title}</p>

          {item.measurement_agg?.[0] && (
            <>
              <p>Mean: {item.measurement_agg[0].mean}</p>
              <p>SD: {item.measurement_agg[0].sd}</p>
              <p>n: {item.measurement_agg[0].n}</p>
            </>
          )}
        </div>
      ))}
    </main>
  )
}