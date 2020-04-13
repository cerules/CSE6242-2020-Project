echo glove build directory: $1
echo sense2vec scripts directory: $2
echo training output directory: $3
for file in ../data/sentences/*; do
    python $201_parse.py $file $301
done

for file in $301/*; do
    python $202_preprocess.py $file $302
done

python $203_glove_build_counts.py $1 $302/ $303 -w 15 -v 2
python $204_glove_train_vectors.py $1 $303/cooccurrence.shuf.bin $303/vocab.txt $304
python $205_export.py $304/vectors_glove_128dim.txt $303/vocab.txt $305
python $206_precompute_cache.py $305