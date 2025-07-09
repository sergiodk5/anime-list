<template>
    <div class="p-4">
        <h1 class="text-2xl font-bold">Options Page</h1>

        <nav>
            <RouterLink to="/">Go to Home</RouterLink>
            <RouterLink to="/list">Go to your list</RouterLink>
            <RouterLink to="/watch-list">Go to your list</RouterLink>
        </nav>
    </div>

    <RouterView />
</template>
