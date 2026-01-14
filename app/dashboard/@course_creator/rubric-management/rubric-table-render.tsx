'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  CirclePlus,
  EllipsisVertical,
  Globe,
  Lock,
  PencilIcon,
  PenIcon,
  PlusCircle,
  TrashIcon,
  Triangle
} from 'lucide-react';

import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import InlineNewRubricCriteria from './inline-new-criteria';
import InlineNewScoringLevel from './inline-new-scoringlevel';

interface RubricTableProps {
  rubric: any;
  scoringLevels: any[];
  criteria: any[];
  matrixCells: any;

  linked: boolean;
  onAssociateRubricWithCourse: (rubricId: string) => void;
  onRemoveRubricAssociation: (rubricId: string) => void;

  onEditRubric: (rubricId: string) => void;
  onDeleteRubric: (rubricId: string) => void;
  onAddCriterion: (rubricId: string) => void;
  onAddScoringLevel: (rubricId: string) => void;
  onEditScoringLevel: (rubricId: string, levelId: string) => void;
  onDeleteScoringLevel: (rubricId: string, levelId: string) => void;
  onInitializeMatrix?: (rubricId: string) => void;

  onEditCriterion: (rubricId: string, criterionId: string) => void;
  onDeleteCriterion: (rubricId: string, criterionId: string) => void;
  onAddScoring: (rubricId: string, criterionId: string) => void;
  onEditCriterionScoring: (rubricId: string, cell: any) => void;
  onDeleteCriterionScoring: (rubricId: string, cell: string) => void;
}

const RubricTable: React.FC<RubricTableProps> = ({
  rubric,
  scoringLevels,
  criteria,
  matrixCells,

  linked,
  onAssociateRubricWithCourse,
  onRemoveRubricAssociation,

  onEditRubric,
  onDeleteRubric,
  //
  onAddCriterion,
  onAddScoringLevel,
  onEditScoringLevel,
  onDeleteScoringLevel,
  //
  onEditCriterion,
  onDeleteCriterion,
  onAddScoring,
  onEditCriterionScoring,
  onDeleteCriterionScoring,
  onInitializeMatrix,
}) => {
  const [open, setOpen] = useState(true);
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const [isScoringOpen, setIsScoringOpen] = useState(false);

  const sortedLevels = [...scoringLevels].sort((a, b) => a.level_order - b.level_order);
  const sortedCriteria = [...criteria].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className='overflow-hidden rounded-lg border shadow-sm'>
      {/* Header */}
      <div className='flex items-center rounded-t-lg px-4 py-3 font-semibold'>
        <div className='w-full flex flex-row items-center justify-between'>
          <div onClick={() => setOpen(open)} className='flex w-full flex-col gap-2 text-left'>
            <p>{rubric.title}</p>
            <p className='text-muted-foreground line-clamp-2 max-w-[95%] text-sm font-normal'>
              {rubric.description}
            </p>

            <div className='flex flex-row gap-6 text-sm font-normal'>
              <p className='flex items-center gap-1'>
                <Triangle size={14} fill='green' /> Type: {rubric.rubric_type}
              </p>
              <p className='flex items-center gap-1'>
                {rubric.is_public ? <Globe size={14} /> : <Lock size={14} />}
                {rubric.is_public ? 'Public Rubric' : 'Private Rubric'}
              </p>
            </div>

            <div className='flex flex-row items-center justify-between mt-4'>
              <div className='flex flex-row gap-2' >
                {linked ? (
                  <Button
                    onClick={() => onRemoveRubricAssociation(rubric.uuid)}
                    variant='destructive'
                  >
                    Remove rubric from course
                  </Button>
                ) : (
                  <Button onClick={() => onAssociateRubricWithCourse(rubric.uuid)} variant='default'>
                    Link rubric to course
                  </Button>
                )}
                <div className="flex justify-end">
                  <Button type="button" onClick={() => setIsCriteriaOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Criteria
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setIsScoringOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Scoring Level
                  </Button>
                </div>
              </div>


              <div className='flex flex-row gap-3' >
                <Button variant="default" onClick={() => onEditRubric(rubric.uuid)}>
                  <PenIcon className='h-4 w-4' />
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onDeleteRubric(rubric.uuid)}
                  className='text-destructive'
                >
                  <TrashIcon className='h-4 w-4' color='white' />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className='my-8'>
        {isCriteriaOpen && (
          <InlineNewRubricCriteria
            rubricId={rubric.uuid}
            onClose={() => setIsCriteriaOpen(false)}
          />
        )}
      </div>

      <div className='mx-auto my-8'>
        {isScoringOpen && (
          <InlineNewScoringLevel
            rubricId={rubric.uuid}
            onClose={() => setIsScoringOpen(false)}
          />
        )}
      </div>


      {open && (
        <div className='overflow-x-auto'>
          {sortedCriteria.length === 0 ? (
            <div className='text-muted-foreground p-4 text-sm italic'>No criteria added.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className=''>
                  <TableHead className='min-w-[240px]'>Criteria</TableHead>
                  {[...sortedLevels]
                    .sort((a, b) => a.level_order - b.level_order)
                    .map(level => (
                      <TableHead
                        key={level.uuid}
                        className='group relative py-2 text-center'
                        style={{ backgroundColor: level.color_code }}
                      >
                        <div>
                          {level.name}
                          <br />
                          <span className='text-muted-foreground text-sm'>
                            ({level.points} pts)
                          </span>
                        </div>

                        <div className='absolute top-1 right-1 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100'>
                          <button
                            onClick={() => onEditScoringLevel(rubric.uuid, level)}
                            className='bg-card/80 hover:bg-card rounded-md p-1 transition'
                            title='Edit'
                          >
                            <PencilIcon className='text-foreground h-4 w-4' />
                          </button>
                          <button
                            onClick={() => onDeleteScoringLevel(rubric.uuid, level.uuid)}
                            className='bg-card/80 hover:bg-card rounded-md p-1 transition'
                            title='Delete'
                          >
                            <TrashIcon className='text-destructive h-4 w-4' />
                          </button>
                        </div>
                      </TableHead>
                    ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedCriteria.map(crit => (
                  <TableRow key={crit.uuid}>
                    <TableCell className='w-[300px] max-w-[300px] align-top'>
                      <div className='flex items-start justify-between gap-2 py-2'>
                        <div className='flex-1'>
                          <div className='font-medium'>{crit.component_name}</div>
                          <div className='text-muted-foreground text-xs whitespace-pre-wrap'>
                            {crit.description}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon'>
                              <EllipsisVertical className='text-muted-foreground h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() => onEditCriterion(rubric.uuid, crit.uuid)}
                            >
                              <PenIcon className='mr-2 h-4 w-4' />
                              Edit Criterion
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                // onAddScoring(rubric.uuid, crit.uuid)
                                toast.message('Update criteria scoring in the rubric matrix')
                              }
                            >
                              <CirclePlus className='mr-2 h-4 w-4' />
                              Add Scoring
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteCriterion(rubric.uuid, crit.uuid)}
                              className='text-destructive'
                            >
                              <TrashIcon className='mr-2 h-4 w-4' />
                              Delete Criterion
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>

                    {sortedLevels.map(level => {
                      const cell = matrixCells[`${crit.uuid}_${level.uuid}`] || null;

                      return (
                        <TableCell
                          key={level.uuid}
                          className='group relative min-w-[120px] align-middle text-sm'
                        >
                          {cell ? (
                            <>
                              <div className='text-muted-foreground w-auto text-xs whitespace-pre-wrap'>
                                {cell.description ? (
                                  <p className='mb-1'>{cell.description}</p>
                                ) : (
                                  <span className='text-muted-foreground italic'>
                                    No description
                                  </span>
                                )}
                              </div>

                              <div className='text-muted-foreground text-xs'>{cell.points} pts</div>

                              <div className='absolute top-1 right-1 hidden gap-1 group-hover:flex'>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => onEditCriterionScoring(rubric.uuid, cell)}
                                >
                                  <PenIcon className='h-4 w-4' />
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => onDeleteCriterionScoring(rubric.uuid, cell)}
                                >
                                  <TrashIcon className='text-destructive h-4 w-4' />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <span className='text-muted-foreground'>-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
};

export default RubricTable;
