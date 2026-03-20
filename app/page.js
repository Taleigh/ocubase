import { supabase } from '../lib/supabase'

export default async function Home() {
  const { data, error } = await supabase
    .from('observation')
    .select(`
      id,
      method_type,
      measurement_context,
      age_range,
      sex,
      health_status,
      units,
      parameter(name),
      tissue(name),
      source(title),
      measurement_agg(mean, sd, min, max, n)
    `)

  if (error) {
    return <p>Error: {error.message}</p>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>OcuBase</h1>

      {data.map((obs) => (
        <div key={obs.id} style={{ marginBottom: '20px' }}>
          <h2>{obs.parameter.name}</h2>

          <p><strong>Tissue:</strong> {obs.tissue.name}</p>
          <p><strong>Study:</strong> {obs.source.title}</p>

          <p><strong>Method:</strong> {obs.method_type}</p>
          <p><strong>Context:</strong> {obs.measurement_context}</p>

          {obs.measurement_agg?.[0] && (
            <div>
              <p><strong>Mean:</strong> {obs.measurement_agg[0].mean} {obs.units}</p>
              <p><strong>SD:</strong> {obs.measurement_agg[0].sd}</p>
              <p><strong>Range:</strong> {obs.measurement_agg[0].min}–{obs.measurement_agg[0].max}</p>
              <p><strong>n:</strong> {obs.measurement_agg[0].n}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}