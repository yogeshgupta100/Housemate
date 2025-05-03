import FavoritesService from "../services/favoritesService.js";

export const getFavorites = async (req, res) => {
    try {
        console.log("error");
        const favorites = await FavoritesService.getFavorites(req.user.id);
        res.json(favorites);
    } catch (error) {
        console.log("error",error);
        res.status(400).json({ message: error.message });
    }
};

export const addFavorite = async (req, res) => {
    try {
        console.log("error");
        const favorites = await FavoritesService.addFavorite(req.user.id, req.params.propertyId);
        console.log(req.user)
        res.json({ message: 'Property added to favorites', favorites, status: 200});
    } catch (error) {
        console.log("error",error);
        res.status(400).json({ message: error.message });
    }
};

export const removeFavorite = async (req, res) => {
    try {
        const favorites = await FavoritesService.removeFavorite(req.user.id, req.params.propertyId);
        res.json({ message: 'Property removed from favorites', favorites });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const isPropertyFavorited = async (req, res) => {
    try {
        const isFavorited = await FavoritesService.isPropertyFavorited(req.user.id, req.params.propertyId);
        res.json({ isFavorited });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
