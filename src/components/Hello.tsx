import { useEffect, useState } from "react";
import { getGreeting } from "../utils/utils";
import { fetchUser } from "../utils/api";

type HelloProps = {
  name: string;
  onFire?: (name: string) => void
};

export const Hello = ({ name, onFire }: HelloProps) => {
  const [greeting, setGreeting] = useState('No greeting');
  const [user, setUser] = useState(name);

  const sum = (a: number, b: number) => {
    return a + b
  }

  const [msg, setMsg] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setMsg('Hello after delay!');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const [userName, setUserName] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const userName = await fetchUser();
      // setUserName(userName);
    };

    loadUser();
  }, []);

  const handleClick = () => {
    const message = `Hello ${user}`
    setGreeting(message);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if(type === 'user') {
      setUser(e.target.value);
    }
  };

  const handleFire = (name: string) => {
    onFire && onFire(name)
  };

  return (<>
    <h1 data-testid="name" id="name">Hello, {name}!</h1>
    <div data-testid="sum" id="sum">{sum(2, 3)}</div>
    <input data-testid="user" value={user} onChange={(e) => handleChange(e, 'user')}/>
    <button data-testid="btn" onClick={() => handleClick()}>Greet</button>
    <div data-testid="greeting">{greeting}</div>
    <div data-testid="fire" onClick={() => handleFire(name)}>{greeting}</div>
    <br/>
    <br/>
    <div data-testid="gID">{getGreeting(name)}</div>
    <div data-testid="msg">{msg}</div>;

    <br/>
    <br/>
    <div data-testid="userName">{userName}</div>
  </>)
};
