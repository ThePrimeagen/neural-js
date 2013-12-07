
// function initialize(inputs) {

// }

// private int num_ants; //R
// private double pheromone_amount;
// private double[][] T; //Pheromone table. N X K
// private int cluster_num; //K
// private Ant[] ohgodsomanyants; //Ants. Length num_ants
// private Ant misterT; //Best ant
// private Data d;
// private double[][] training_data; //Length N
// private double exploitationProb;
// private int bestLnum;

// private int antStep(Ant a) {
//     int[] current_solution = a.getSolution();
//     int solution_index = a.getSolutionIndex();

//     double[] pheromonesHere = T[solution_index];

//     if (Math.random() < exploitationProb) {
//         int maxIndex = 0;
//         for (int i = 1; i < cluster_num; i++) {
//             if (pheromonesHere[i] > pheromonesHere[maxIndex]) {
//                 maxIndex = i;
//             }
//         }
//         current_solution[solution_index] = maxIndex;
//     } else {
//         current_solution[solution_index] = (int) (Math.random() * cluster_num);
//     }
//     solution_index++;
//     a.setSolution(current_solution);
//     a.setSolutionIndex(solution_index);
//     return current_solution[solution_index - 1];
// }

// public double fitness(Ant a) {
//     return 0.0;
// }

// @Override
// public void iteration() {
//     //flush the ants and restart. Better than reinitializing everything.
//     for (Ant a : ohgodsomanyants) {
//         a.setSolution(new int[training_data.length]);
//         a.setSolutionIndex(0);
//         //Have ants find a solution
//         for (int i = 0; i < training_data.length; i++) {
//             antStep(a);
//         }
//     }
    
//     //assign weights???
    
//     double[] fitnesses = new double[num_ants];
            
//     for (int i = 0; i < num_ants; i++) {
//         fitnesses[i] = fitness(ohgodsomanyants[i]);
//     }
    
//     //to find best L individuals, we sort the list using counting sort. O(n + k)
//     Valueator<Ant> v = new Valueator<Ant>() {

//         @Override
//         public long getValue(Ant o) {
            
//             return (long) (o.getFitness() * 100000);
//         }

//         @Override
//         public boolean useMap() {
//             return true;
//         }
        
//     };
//     InsertionSort<Ant> cs = new InsertionSort<>();
//     cs.sort(ohgodsomanyants, v);
    
//     //lay pheromones.
    
// }

// @Override
// public void setData(Data d) {
//     throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
// }

// @Override
// public Data getData() {
//     throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
// }

// @Override
// public double[] output(double[] d) {
//     //Want to find ant with best fitness.
//     //Assign d to that cluster.
//     throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
// }

// @Override
// public void flush() {
//     throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
// }

// @Override
// public void config() {
//     int default_cluster_num = 10;
//     double default_pheromone_amount = .1;
//     int default_num_ants = 12;

//     this.num_ants = default_num_ants;
//     this.cluster_num = default_cluster_num;
//     this.pheromone_amount = default_pheromone_amount;

//     this.T = new double[training_data.length][cluster_num]; //pheromone matrix
//     for (double[] current : T) {
//         for (int j = 0; j < current.length; j++) {
//             current[j] = Math.random();
//         }
//     }
//     this.ohgodsomanyants = new Ant[num_ants]; //ants
//     for (Ant a : ohgodsomanyants) { //initialize ants
//         int[] ant_solution = new int[training_data.length];
//         a = new Ant(ant_solution);
//     }

// }

// @Override
// public void config(String s) {
//     throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
// }

// @Override
// public double[][] getCentroids() {
//     throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
// }



// exports = {

// };

// module.exports = exports;