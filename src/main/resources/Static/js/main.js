'use strict';

var usernamePage = document.querySelector('#username-page');
var userForm = document.querySelector('#user-form');

var chatPage = document.querySelector('#chat-page');
// var chatPage = document.querySelector('#form-container');

var messageForm = document.querySelector('#messageForm');
// var messageForm = document.querySelector('#message-form');

//same
var messageInput = document.querySelector('#message');


var messageArea = document.querySelector('#messageArea');

var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var username = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect(event) {
    username = document.querySelector('#username').value.trim();

    if(username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}


function onConnected() {
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    )

    connectingElement.classList.add('hidden');
}


function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}


function sendMessage(event) {
    var messageContent = messageInput.value.trim();

    if(messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            message: messageInput.value,
            type: 'CHAT'
        };
        console.log("send message");
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}


function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');

    function extracted() {
        var textElement = document.createElement('span');
        var messageText = document.createTextNode(message.message);
        textElement.appendChild(messageText);
        messageElement.appendChild(textElement);
    }


    if(message.type === 'CHAT') {
        messageElement.classList.add('chat-message');

        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        extracted();
        var usernameElement = document.createElement('p');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);


    } else if (message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.message = message.sender + ' joined!';
        extracted();

    } else {
        messageElement.classList.add('event-message');
        message.message = message.sender + ' left!';
        extracted();

    }


    messageArea.appendChild(messageElement);


    messageArea.scrollTop = messageArea.scrollHeight;
}


function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

function exitChat() {
    if (stompClient) {
        stompClient.disconnect();
    }
    usernamePage.classList.remove('hidden');
    chatPage.classList.add('hidden');
    var nameInput = document.querySelector('#username');
    nameInput.value = ''; // Reset the value to empty
    nameInput.placeholder = 'Enter your name';
}

document.getElementById('exitButton').addEventListener('click', exitChat, true);
userForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);

