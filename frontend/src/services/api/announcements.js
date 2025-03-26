const API_URL = 'http://localhost:8000/api';  // Убедитесь, что URL правильный

export const AnnouncementsService = {
    async getAll() {
        try {
            const response = await fetch(`${API_URL}/announcements/`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching announcements:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const response = await fetch(`${API_URL}/announcements/${id}/`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching announcement:', error);
            throw error;
        }
    },

    // async getAllWithWalkScore() {
    //     try {
    //         const response = await fetch(`${API_URL}/announcements/`);
    //         if (!response.ok) {
    //             throw new Error('Network response was not ok');
    //         }
    //         const data = await response.json();
    //         return data.map(item => ({
    //             ...item,
    //             walkScore: item.walk_score || 0,
    //         }));
    //     } catch (error) {
    //         console.error('Error fetching announcements with walk score:', error);
    //         throw error;
    //     }
    // },

}; 