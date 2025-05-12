const DEFAULT_IMAGE_URL = 'https://via.placeholder.com/150';

export const handleFavoriteClick = async (e, announcement, context) => {
    e.preventDefault();
    const { token, toggleFavorite, updateFavorites } = context;
    
    try {
        if (token) {
            // Для авторизованных пользователей
            await toggleFavorite(announcement.announcement_id);
            if (updateFavorites) {
                await updateFavorites(); // Обновляем список избранных
            }
            return !context.isFavorite(announcement.announcement_id);
        } else {
            // Для гостей
            const guestFavorites = JSON.parse(localStorage.getItem('guest_favorites')) || [];
            const favoriteIndex = guestFavorites.findIndex(fav => fav.id === announcement.announcement_id);
            
            if (favoriteIndex !== -1) {
                // Удаляем из избранного
                guestFavorites.splice(favoriteIndex, 1);
                localStorage.setItem('guest_favorites', JSON.stringify(guestFavorites));
                return false;
            } else {
                // Добавляем в избранное
                const newFavorite = {
                    id: announcement.announcement_id,
                    title: announcement.name,
                    price: announcement.price,
                    url: announcement.url || '#',
                    image: announcement.photo || DEFAULT_IMAGE_URL,
                    date: announcement.published_at ? new Date(announcement.published_at) : new Date(),
                    walk_score: announcement.walk_score,
                };
                
                guestFavorites.push(newFavorite);
                localStorage.setItem('guest_favorites', JSON.stringify(guestFavorites));
                return true;
            }
        }
    } catch (error) {
        console.error('Error handling favorite:', error);
        throw error;
    }
};

export const isFavorite = (announcementId, context) => {
    if (!announcementId) return false;
    
    if (context.token) {
        return context.favorites?.includes(announcementId) || false;
    } else {
        const guestFavorites = JSON.parse(localStorage.getItem('guest_favorites')) || [];
        return guestFavorites.some(fav => fav.id === announcementId);
    }
};

export const getFavorites = (context) => {
    if (context.token) {
        return context.favorites || [];
    } else {
        const guestFavorites = JSON.parse(localStorage.getItem('guest_favorites')) || [];
        return guestFavorites.map(fav => fav.id);
    }
};