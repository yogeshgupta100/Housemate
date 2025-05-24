import FavoritesService from "../services/favoritesService.js";

export const getFavorites = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        const favorites = await FavoritesService.getFavorites(userId);
        res.json({ favorites });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const addFavorite = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        const propertyId = Number(req.params.propertyId);
        const favorites = await FavoritesService.addFavorite(userId, propertyId);
        res.json({ message: 'Property added to favorites', favorites });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const removeFavorite = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        const propertyId = Number(req.params.propertyId);
        const favorites = await FavoritesService.removeFavorite(userId, propertyId);
        res.json({ message: 'Property removed from favorites', favorites });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const isPropertyFavorited = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        const propertyId = Number(req.params.propertyId);
        const isFavorited = await FavoritesService.isPropertyFavorited(userId, propertyId);
        res.json({ isFavorited });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
