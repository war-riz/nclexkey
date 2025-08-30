'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ApiTest() {
  const [apiStatus, setApiStatus] = useState('checking')
  const [backendStatus, setBackendStatus] = useState('checking')
  const [testResults, setTestResults] = useState({})

  useEffect(() => {
    testApiConnection()
  }, [])

  const testApiConnection = async () => {
    try {
      // Test backend connection
      const backendResponse = await fetch('http://localhost:8000/')
      setBackendStatus(backendResponse.ok ? 'connected' : 'error')

      // Test API endpoints
      const endpoints = [
        { name: 'Auth Login', url: 'http://localhost:8000/api/auth/login/', method: 'POST' },
        { name: 'Courses', url: 'http://localhost:8000/api/courses/', method: 'GET' },
        { name: 'Categories', url: 'http://localhost:8000/api/courses/categories/', method: 'GET' },
        { name: 'Payment Banks', url: 'http://localhost:8000/api/payments/banks/', method: 'GET' },
      ]

      const results = {}
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint.url, { 
            method: endpoint.method,
            headers: endpoint.method === 'POST' ? { 'Content-Type': 'application/json' } : {}
          })
          results[endpoint.name] = response.status
        } catch (error) {
          results[endpoint.name] = 'error'
        }
      }
      setTestResults(results)
      setApiStatus('completed')
    } catch (error) {
      setBackendStatus('error')
      setApiStatus('error')
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>API Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Backend Server:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            backendStatus === 'connected' ? 'bg-green-100 text-green-800' :
            backendStatus === 'error' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {backendStatus === 'connected' ? 'Connected' :
             backendStatus === 'error' ? 'Error' : 'Checking...'}
          </span>
        </div>

        {apiStatus === 'completed' && (
          <div className="space-y-2">
            <h4 className="font-medium">API Endpoints:</h4>
            {Object.entries(testResults).map(([name, status]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm">{name}:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  status === 200 || status === 405 ? 'bg-green-100 text-green-800' :
                  status === 401 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {status === 200 ? 'OK' :
                   status === 405 ? 'Method Not Allowed' :
                   status === 401 ? 'Auth Required' :
                   status === 'error' ? 'Error' : `${status}`}
                </span>
              </div>
            ))}
          </div>
        )}

        <Button onClick={testApiConnection} className="w-full">
          Test API Connection
        </Button>
      </CardContent>
    </Card>
  )
}
