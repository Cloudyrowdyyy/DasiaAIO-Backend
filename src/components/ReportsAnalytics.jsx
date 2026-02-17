import { useState, useEffect } from 'react'
import './ReportsAnalytics.css'

export default function ReportsAnalytics({ user, onClose }) {
  const [reportType, setReportType] = useState('firearm-audit')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [filterGuard, setFilterGuard] = useState('')
  const [guards, setGuards] = useState([])
  const [exportFormat, setExportFormat] = useState('csv')

  useEffect(() => {
    fetchGuards()
  }, [])

  const fetchGuards = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/guards')
      if (response.ok) {
        const guardsList = await response.json()
        setGuards(guardsList)
      }
    } catch (error) {
      console.error('Error fetching guards:', error)
    }
  }

  const generateFirearmAuditReport = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/firearms')
      if (response.ok) {
        const firearms = await response.json()
        
        const reportData = firearms.map(firearm => ({
          'Firearm ID': firearm._id || 'N/A',
          'Serial Number': firearm.serialNumber || 'N/A',
          'Type': firearm.type || 'N/A',
          'Model': firearm.model || 'N/A',
          'Caliber': firearm.caliber || 'N/A',
          'Status': firearm.status || 'N/A',
          'Location': firearm.location || 'N/A',
          'Last Maintenance': firearm.lastMaintenance ? new Date(firearm.lastMaintenance).toLocaleDateString() : 'N/A',
          'Condition': firearm.condition || 'N/A'
        }))
        
        setData(reportData)
      }
    } catch (error) {
      console.error('Error generating firearm audit report:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const generateAllocationHistoryReport = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/firearm-allocations')
      if (response.ok) {
        const allocations = await response.json()
        
        let filtered = allocations
        if (filterGuard) {
          filtered = allocations.filter(a => a.guardId === filterGuard)
        }

        const reportData = filtered.map(allocation => ({
          'Allocation ID': allocation._id || 'N/A',
          'Guard': allocation.guardName || 'N/A',
          'Firearm': allocation.firearmSerialNumber || 'N/A',
          'Allocation Date': allocation.allocationDate ? new Date(allocation.allocationDate).toLocaleDateString() : 'N/A',
          'Return Date': allocation.returnDate ? new Date(allocation.returnDate).toLocaleDateString() : 'Not Returned',
          'Purpose': allocation.purpose || 'N/A',
          'Status': allocation.status || 'N/A',
          'Condition on Return': allocation.conditionOnReturn || 'N/A'
        }))
        
        setData(reportData)
      }
    } catch (error) {
      console.error('Error generating allocation history report:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const generatePermitExpiryReport = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/guard-firearm-permits')
      if (response.ok) {
        const permits = await response.json()
        const today = new Date()

        const reportData = permits.map(permit => {
          const expiryDate = new Date(permit.expiryDate)
          const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
          const status = daysUntilExpiry < 0 ? 'EXPIRED' : daysUntilExpiry <= 30 ? 'EXPIRING SOON' : 'ACTIVE'

          return {
            'Permit ID': permit._id || 'N/A',
            'Guard': permit.guardName || 'N/A',
            'Firearm': permit.firearmSerialNumber || 'N/A',
            'Issue Date': permit.issueDate ? new Date(permit.issueDate).toLocaleDateString() : 'N/A',
            'Expiry Date': new Date(permit.expiryDate).toLocaleDateString(),
            'Days Until Expiry': daysUntilExpiry,
            'Status': status,
            'Authority': permit.authority || 'N/A'
          }
        })
        
        setData(reportData)
      }
    } catch (error) {
      console.error('Error generating permit expiry report:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const generateMaintenanceReport = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/firearm-maintenance')
      if (response.ok) {
        const maintenance = await response.json()

        const reportData = maintenance.map(record => ({
          'Firearm': record.firearmSerialNumber || 'N/A',
          'Maintenance Type': record.maintenanceType || 'N/A',
          'Date': record.date ? new Date(record.date).toLocaleDateString() : 'N/A',
          'Performed By': record.performedBy || 'N/A',
          'Notes': record.notes || 'N/A',
          'Next Due Date': record.nextDueDate ? new Date(record.nextDueDate).toLocaleDateString() : 'N/A',
          'Cost': record.cost ? `$${record.cost}` : 'N/A'
        }))
        
        setData(reportData)
      }
    } catch (error) {
      console.error('Error generating maintenance report:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    switch (reportType) {
      case 'firearm-audit':
        await generateFirearmAuditReport()
        break
      case 'allocation-history':
        await generateAllocationHistoryReport()
        break
      case 'permit-expiry':
        await generatePermitExpiryReport()
        break
      case 'maintenance':
        await generateMaintenanceReport()
        break
      default:
        break
    }
  }

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert('No data to export')
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          const escaped = String(value).replace(/"/g, '""')
          return `"${escaped}"`
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const exportToJSON = () => {
    if (!data || data.length === 0) {
      alert('No data to export')
      return
    }

    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `report-${reportType}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const exportToPDF = () => {
    if (!data || data.length === 0) {
      alert('No data to export')
      return
    }

    // Simple PDF generation using HTML table
    let html = `
      <html>
        <head>
          <title>Report - ${reportType}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { border-collapse: collapse; width: 100%; }
            th { background-color: #4CAF50; color: white; padding: 10px; text-align: left; }
            td { border: 1px solid #ddd; padding: 8px; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Report: ${reportType}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead><tr>${Object.keys(data[0]).map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>
              ${data.map(row => `
                <tr>${Object.values(row).map(v => `<td>${v}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    const newWindow = window.open('', '', 'width=800,height=600')
    newWindow.document.write(html)
    newWindow.document.close()
    newWindow.print()
  }

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportToCSV()
    } else if (exportFormat === 'json') {
      exportToJSON()
    } else if (exportFormat === 'pdf') {
      exportToPDF()
    }
  }

  const getReportDescription = () => {
    const descriptions = {
      'firearm-audit': 'Complete inventory of all firearms with current status and maintenance history',
      'allocation-history': 'Tracking of all firearm allocations to guards with dates and return status',
      'permit-expiry': 'Overview of guard firearm permits with expiry dates and renewal status',
      'maintenance': 'Maintenance records for all firearms with service dates and costs'
    }
    return descriptions[reportType] || ''
  }

  return (
    <div className="reports-overlay">
      <div className="reports-modal">
        <div className="reports-header">
          <h2>📊 Reports & Analytics</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="reports-container">
          <div className="report-selector">
            <label>Report Type:</label>
            <select 
              value={reportType} 
              onChange={(e) => {
                setReportType(e.target.value)
                setData(null)
              }}
              className="report-select"
            >
              <option value="firearm-audit">Firearm Audit Report</option>
              <option value="allocation-history">Allocation History Report</option>
              <option value="permit-expiry">Permit Expiry Report</option>
              <option value="maintenance">Maintenance Report</option>
            </select>
            <p className="report-description">{getReportDescription()}</p>
          </div>

          {reportType === 'allocation-history' && (
            <div className="filter-section">
              <label>Filter by Guard (Optional):</label>
              <select 
                value={filterGuard}
                onChange={(e) => setFilterGuard(e.target.value)}
                className="guard-select"
              >
                <option value="">All Guards</option>
                {guards.map(guard => (
                  <option key={guard._id} value={guard._id}>
                    {guard.name} ({guard.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="action-buttons">
            <button 
              className="generate-btn"
              onClick={generateReport}
              disabled={loading}
            >
              {loading ? '⏳ Generating...' : '🔄 Generate Report'}
            </button>
          </div>

          {data && (
            <div className="export-section">
              <label>Export Format:</label>
              <div className="export-options">
                <select 
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="format-select"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="pdf">PDF (Print)</option>
                </select>
                <button 
                  className="export-btn"
                  onClick={handleExport}
                >
                  📥 Export {exportFormat.toUpperCase()}
                </button>
              </div>
            </div>
          )}

          {data && (
            <div className="report-data">
              <div className="report-stats">
                <div className="stat-box">
                  <span className="stat-label">Total Records:</span>
                  <span className="stat-value">{data.length}</span>
                </div>
              </div>

              <div className="report-table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      {Object.keys(data[0]).map(header => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((value, colIdx) => (
                          <td key={colIdx}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!data && !loading && (
            <div className="empty-state">
              <p>👈 Select a report type and click "Generate Report" to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
