// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { toast } from 'react-toastify';

// function EditProfile() {
//   const [username, setUsername] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Fetch user profile data
//     const fetchUser = async () => {
//       try {
//         const response = await axios.get('/api/user/profile');
//         setUsername(response.data.username);
//         setEmail(response.data.email);
//       } catch (err) {
//         toast.error('Failed to fetch user data.');
//       }
//     };

//     fetchUser();
//   }, []);

//   const handleUpdateProfile = async (e) => {
//     e.preventDefault();
//     try {
//       await axios.put('/api/user/update', { username, email, password });
//       navigate('/profile');
//       toast.success('Profile updated successfully!');
//     } catch (err) {
//       toast.error('Failed to update profile.');
//     }
//   };

//   return (
//     <div className="edit-profile-container">
//       <h2>Edit Profile</h2>
//       <form onSubmit={handleUpdateProfile}>
//         <div>
//           <label>Username</label>
//           <input
//             type="text"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             required
//           />
//         </div>
//         <div>
//           <label>Email</label>
//           <input
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//           />
//         </div>
//         <div>
//           <label>Password</label>
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />
//         </div>
//         <button type="submit">Update Profile</button>
//       </form>
//     </div>
//   );
// }

// export default EditProfile;
