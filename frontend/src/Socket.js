import React, { useState, useEffect, useRef } from 'react';
import {Centrifuge} from 'centrifuge';
import './Socket.css'

async function getHostBasedChannels(channels) {
    const params = new URLSearchParams();
    channels.forEach((chan) => params.append('channels[]', chan));

    const url = new URL('http://localhost:8000/subscribe');
    url.search = params.toString();

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('x-portal-host', 'slotsio.xyz');

    const response = await fetch(url, {
        method: 'GET',
        headers,
    });

    return await response.json();
}

const Socket = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const centrifugeRef = useRef(null);
    const [subList, setSubList] = useState([]);

    useEffect( () => {
        async function connect() {
            centrifugeRef.current = new Centrifuge('ws://localhost:8000/connection/websocket', {
                token: "blabla"
            });

            centrifugeRef.current.on('connected', function(ctx){
                setMessages((prevMessages) => [...prevMessages, 'Connected over ' + ctx.transport]);
            });

            const channels = ['chat', 'notifications'];
            const {data: hostBasedChannels} = await getHostBasedChannels(channels);

            hostBasedChannels.forEach((chan) => {
                const subscription = centrifugeRef.current.newSubscription(chan);

                subscription.on('publication', function(ctx) {
                    const message = typeof ctx.data === 'string' ? ctx.data : ctx.data.message;

                    setMessages((prevMessages) => [...prevMessages, message]);
                });
                // Move subscription to subscribing state.
                subscription.subscribe();

                setSubList((prevSubList) => [...prevSubList, subscription]);
            })

            centrifugeRef.current.connect();
        }

        connect();
    }, []);

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        const chatSub = subList.find((sub) => sub.channel.includes( "chat"))

        chatSub.publish(input);
        setInput('');
    };

    return (
        <div className="formContainer">
            <h1>Real-time Events</h1>
            <div className="scrollContainer">
                {messages.map((message, index) => (
                    <div key={index}>{message}</div>
                ))}
            </div>
            <form onSubmit={handleSendMessage}>
                <input
                    type="text"
                    placeholder="Type your message"
                    value={input}
                    className="input"
                    onChange={handleInputChange}
                />
            </form>
        </div>
    );
};

export default Socket;
