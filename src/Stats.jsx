import React, { useEffect } from 'react'
import { Log } from './main'

export default function Stats({ links }) {
  useEffect(() => {
    Log('Stats', 'INFO', 'frontend', 'User viewed stats page', { count: links.length })
  }, [links])

  return (
    <div className="p-10">
      <h2 className="text-2xl font-bold mb-4">Statistics</h2>
      <ul className="space-y-2">
        {links.map(l => (
          <li key={l.id} className="bg-cyan-900 p-3 rounded-lg">
            {l.code} → {l.original}
          </li>
        ))}
      </ul>
    </div>
  )
}
