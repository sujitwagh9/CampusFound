import {User} from '../models/user.model.js';


export const getProfile = async (req,res)=>{
    try {
        const user = await User.findById(req.user.id)
        .select('-password')
        .populate('items');

        if(!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error });
    }
}