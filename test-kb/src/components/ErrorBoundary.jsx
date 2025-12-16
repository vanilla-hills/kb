import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    this.setState({ error, info })
  }

  render() {
    const { error, info } = this.state
    if (error) {
      return (
        React.createElement('div', { style: { padding: 20, color: '#fff', background: '#111' } }, [
          React.createElement('h2', { key: 'h2' }, 'An error occurred'),
          React.createElement('pre', { key: 'msg', style: { whiteSpace: 'pre-wrap', fontSize: 13 } }, String(error && (error.stack || error.message || error)) ),
          info ? React.createElement('details', { key: 'info', style: { marginTop: 12 } }, React.createElement('pre', null, String(info.componentStack))) : null
        ])
      )
    }
    return this.props.children
  }
}
