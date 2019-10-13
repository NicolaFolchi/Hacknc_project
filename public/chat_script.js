let socket = io('http://localhost:3000');
let messageContainer = document.getElementById('chat-container');
let messageForm = document.getElementById('message-container');
let messageInput = document.getElementById('message-input');

if (messageForm != null) {
  let name = prompt('What is your name?')
  appendMessage('You joined')
  socket.emit('new-user', roomName, name)

  messageForm.addEventListener('submit', e => {
    e.preventDefault()
    let message = messageInput.value
    appendMessage(`You: ${message}`)
    socket.emit('send-chat-message', roomName, message)
    messageInput.value = ''
  })
}

socket.on('room-created', room => {
  let roomElement = document.createElement('div')
  roomElement.innerText = room
  let roomLink = document.createElement('a')
  roomLink.href = `/${room}`
  roomLink.innerText = 'join'
  roomContainer.append(roomElement)
  roomContainer.append(roomLink)
})

socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`)
})

socket.on('user-connected', name => {
  appendMessage(`${name} connected`)
})

socket.on('user-disconnected', name => {
  appendMessage(`${name} disconnected`)
})

function appendMessage(message) {
  let messageElement = document.createElement('div')
  messageElement.innerText = message
  messageContainer.append(messageElement)
}