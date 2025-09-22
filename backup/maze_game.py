import pygame
import random
import time

# --- Constants ---
# Screen dimensions
SCREEN_WIDTH = 820
SCREEN_HEIGHT = 820

# Maze dimensions (in cells)
MAZE_WIDTH = 40
MAZE_HEIGHT = 40

# Calculate cell size based on screen dimensions
CELL_SIZE = min(SCREEN_WIDTH // (MAZE_WIDTH + 1), SCREEN_HEIGHT // (MAZE_HEIGHT + 1))
MARGIN_X = (SCREEN_WIDTH - MAZE_WIDTH * CELL_SIZE) // 2
MARGIN_Y = (SCREEN_HEIGHT - MAZE_HEIGHT * CELL_SIZE) // 2

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
BLUE = (0, 150, 255)
GOLD = (255, 215, 0)
TRAIL_RED = (200, 50, 50)

# Movement Speed
MOVE_SPEED = 0.12 # Seconds per cell

# --- Cell Class ---
class Cell:
    """Represents a single cell in the maze grid."""
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.walls = {'top': True, 'right': True, 'bottom': True, 'left': True}
        self.visited = False

    def draw(self, screen):
        """Draws the walls of the cell."""
        x_pixel = MARGIN_X + self.x * CELL_SIZE
        y_pixel = MARGIN_Y + self.y * CELL_SIZE
        
        if self.walls['top']:
            pygame.draw.line(screen, WHITE, (x_pixel, y_pixel), (x_pixel + CELL_SIZE, y_pixel), 2)
        if self.walls['right']:
            pygame.draw.line(screen, WHITE, (x_pixel + CELL_SIZE, y_pixel), (x_pixel + CELL_SIZE, y_pixel + CELL_SIZE), 2)
        if self.walls['bottom']:
            pygame.draw.line(screen, WHITE, (x_pixel + CELL_SIZE, y_pixel + CELL_SIZE), (x_pixel, y_pixel + CELL_SIZE), 2)
        if self.walls['left']:
            pygame.draw.line(screen, WHITE, (x_pixel, y_pixel + CELL_SIZE), (x_pixel, y_pixel), 2)

# --- Maze Generation (Depth-First Search) ---
def generate_maze(grid):
    """Generates a maze using the recursive backtracking algorithm."""
    stack = []
    current_cell = grid[0][0]
    current_cell.visited = True
    
    while True:
        x, y = current_cell.x, current_cell.y
        neighbors = []
        if y > 0 and not grid[x][y - 1].visited: neighbors.append(grid[x][y - 1])
        if x < MAZE_WIDTH - 1 and not grid[x + 1][y].visited: neighbors.append(grid[x + 1][y])
        if y < MAZE_HEIGHT - 1 and not grid[x][y + 1].visited: neighbors.append(grid[x][y + 1])
        if x > 0 and not grid[x - 1][y].visited: neighbors.append(grid[x - 1][y])
        
        if neighbors:
            next_cell = random.choice(neighbors)
            dx = current_cell.x - next_cell.x
            dy = current_cell.y - next_cell.y
            if dx == 1: current_cell.walls['left'], next_cell.walls['right'] = False, False
            elif dx == -1: current_cell.walls['right'], next_cell.walls['left'] = False, False
            if dy == 1: current_cell.walls['top'], next_cell.walls['bottom'] = False, False
            elif dy == -1: current_cell.walls['bottom'], next_cell.walls['top'] = False, False
            stack.append(current_cell)
            current_cell = next_cell
            current_cell.visited = True
        elif stack:
            current_cell = stack.pop()
        else: break

# --- Main Game Function ---
def main():
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("Random Maze Navigator")
    clock = pygame.time.Clock()
    font = pygame.font.Font(None, 36)

    grid = [[Cell(x, y) for y in range(MAZE_HEIGHT)] for x in range(MAZE_WIDTH)]
    generate_maze(grid)

    # --- Player and Goal Setup ---
    player_pos = [0, 0] # Logical grid position
    start_pos = (0, 0)
    end_pos = (MAZE_WIDTH - 1, MAZE_HEIGHT - 1)
    
    # --- New Tracking Variables ---
    player_path = [tuple(player_pos)] # For drawing the trail
    visited_cells = {tuple(player_pos)} # For tracking backtracking
    move_count = 0
    backtrack_count = 0
    start_game_time = time.time()
    final_time = 0
    final_score = 0
    
    # --- Animation Variables ---
    is_moving = False
    anim_start_time = 0
    start_pixel_pos, target_pixel_pos = [0, 0], [0, 0]

    # --- Game State ---
    game_won = False
    
    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
        
        # --- Continuous Movement Logic ---
        if not is_moving and not game_won:
            keys = pygame.key.get_pressed()
            current_cell = grid[player_pos[0]][player_pos[1]]
            next_pos = list(player_pos)
            
            moved = False
            if keys[pygame.K_LEFT] and not current_cell.walls['left']:
                next_pos[0] -= 1; moved = True
            elif keys[pygame.K_RIGHT] and not current_cell.walls['right']:
                next_pos[0] += 1; moved = True
            elif keys[pygame.K_UP] and not current_cell.walls['top']:
                next_pos[1] -= 1; moved = True
            elif keys[pygame.K_DOWN] and not current_cell.walls['bottom']:
                next_pos[1] += 1; moved = True

            if moved:
                move_count += 1
                if tuple(next_pos) in visited_cells:
                    backtrack_count += 1
                visited_cells.add(tuple(next_pos))
                
                is_moving = True
                anim_start_time = time.time()
                start_pixel_pos = [MARGIN_X + player_pos[0] * CELL_SIZE + CELL_SIZE // 2, MARGIN_Y + player_pos[1] * CELL_SIZE + CELL_SIZE // 2]
                target_pixel_pos = [MARGIN_X + next_pos[0] * CELL_SIZE + CELL_SIZE // 2, MARGIN_Y + next_pos[1] * CELL_SIZE + CELL_SIZE // 2]
                player_pos = next_pos
                player_path.append(tuple(player_pos))

        # --- Animation Update ---
        current_pixel_pos = [MARGIN_X + player_pos[0] * CELL_SIZE + CELL_SIZE // 2, MARGIN_Y + player_pos[1] * CELL_SIZE + CELL_SIZE // 2]
        if is_moving:
            elapsed_time = time.time() - anim_start_time
            anim_progress = min(elapsed_time / MOVE_SPEED, 1.0)
            current_pixel_pos[0] = start_pixel_pos[0] + (target_pixel_pos[0] - start_pixel_pos[0]) * anim_progress
            current_pixel_pos[1] = start_pixel_pos[1] + (target_pixel_pos[1] - start_pixel_pos[1]) * anim_progress
            if anim_progress >= 1.0:
                is_moving = False
                
        # --- Game Win Logic ---
        if tuple(player_pos) == end_pos and not game_won:
            game_won = True
            final_time = time.time() - start_game_time
            # --- Scoring Formula ---
            # Start with 10,000 points. Penalize for time, moves, and backtracking.
            score = 10000
            score -= int(final_time) * 10 # 10 points per second
            score -= move_count * 5 # 5 points per move
            score -= backtrack_count * 50 # 50 points per backtrack (heavy penalty)
            final_score = max(0, int(score)) # Score cannot be negative
        
        # --- Drawing ---
        screen.fill(BLACK)

        # Draw start and end points
        pygame.draw.rect(screen, GREEN, (MARGIN_X, MARGIN_Y, CELL_SIZE, CELL_SIZE))
        pygame.draw.rect(screen, RED, (MARGIN_X + end_pos[0] * CELL_SIZE, MARGIN_Y + end_pos[1] * CELL_SIZE, CELL_SIZE, CELL_SIZE))

        # Draw the player's trail 👣
        if len(player_path) > 1:
            pixel_path = [(MARGIN_X + x * CELL_SIZE + CELL_SIZE // 2, MARGIN_Y + y * CELL_SIZE + CELL_SIZE // 2) for x, y in player_path]
            pygame.draw.lines(screen, TRAIL_RED, False, pixel_path, CELL_SIZE // 5)

        # Draw the maze cells
        for row in grid:
            for cell in row:
                cell.draw(screen)

        # Draw the player dot
        pygame.draw.circle(screen, BLUE, (int(current_pixel_pos[0]), int(current_pixel_pos[1])), CELL_SIZE // 3)
        
        # --- Draw UI Text ---
        # Timer ⏱️
        elapsed_time = final_time if game_won else time.time() - start_game_time
        time_text = font.render(f"Time: {int(elapsed_time)}s", True, WHITE)
        screen.blit(time_text, (10, 10))

        # Move Count
        move_text = font.render(f"Moves: {move_count}", True, WHITE)
        screen.blit(move_text, (10, 40))

        # Backtrack Count
        backtrack_text = font.render(f"Backtracks: {backtrack_count}", True, WHITE)
        screen.blit(backtrack_text, (10, 70))
        
        # --- Display Win Message and Score 💯 ---
        if game_won:
            win_font = pygame.font.Font(None, 100)
            win_text = win_font.render("You Win!", True, GOLD)
            win_rect = win_text.get_rect(center=(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50))
            
            score_font = pygame.font.Font(None, 74)
            score_text = score_font.render(f"Score: {final_score}", True, GOLD)
            score_rect = score_text.get_rect(center=(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50))
            
            screen.blit(win_text, win_rect)
            screen.blit(score_text, score_rect)
        
        pygame.display.flip()

    pygame.quit()

if __name__ == "__main__":
    main()