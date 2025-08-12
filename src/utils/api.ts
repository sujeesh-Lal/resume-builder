export const fetchUser = async () => {
  const res = await fetch('http://localhost:3000/api/data');
  const data = await res.json();
  return data[0].name;
};
